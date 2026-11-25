-- =====================================================================
-- Solar: panel details per block + evening meter readings by guards
-- (replaces SOLAR_PANEL_DETAIL_SS.xlsx and Daily_Solar_Reading_A_to_I_BLOCK.xlsx)
-- =====================================================================

-- Panel details (one row per block) — seeded from SOLAR_PANEL_DETAIL_SS.xlsx
create table public.solar_blocks (
  block                text primary key check (block ~ '^[A-Z]$'),
  sr_no                integer,
  panel_brand          text,              -- EXISTING INSTALLED PANEL NAME
  panel_wp             integer,           -- PANEL WP
  panel_count          integer,           -- NO. OF PANEL INSTALLED
  kw_installed         numeric(8,3),      -- KW INSTALLED
  availability         text,              -- AVAILABILITY
  area_served          text,              -- AREA (what the solar supplies)
  extra_capacity_text  text,              -- Additional Panel Capacity is Feasible (as written)
  extra_capacity_kw    numeric(6,2),      -- same, as a number for totals
  maintenance_required boolean,           -- MAINTENANCE REQUIRED
  meter_location       text,              -- where the guard finds the meter (optional)
  active               boolean not null default true,
  notes                text,
  updated_at           timestamptz not null default now()
);

insert into public.solar_blocks
  (block, sr_no, panel_brand, panel_wp, panel_count, kw_installed, availability, area_served, extra_capacity_text, extra_capacity_kw, maintenance_required) values
  ('A', 1, 'ANCHOR',    330, 10, 3.300, 'YES', 'TANK',          '6 KW', 6, true),
  ('B', 2, 'SANELLITE', 335,  9, 3.015, 'YES', 'TANK',          '5 KW', 5, true),
  ('C', 3, 'SANELLITE', 335,  9, 3.015, 'YES', 'TANK',          '5 KW', 5, true),
  ('D', 4, 'RAYZON',    335, 17, 5.695, 'YES', 'TANK AND LIFT', '2 KW', 2, true),
  ('E', 5, 'RAYZON',    335, 17, 5.695, 'YES', 'TANK AND LIFT', '2 KW', 2, true),
  ('F', 6, 'RAYZON',    545, 11, 5.995, 'YES', 'TANK AND LIFT', '3 KW', 3, true),
  ('G', 7, 'ANCHOR',    330, 10, 3.300, 'YES', 'TANK',          '5 KW', 5, true),
  ('H', 8, 'RAYZON',    545, 11, 5.995, 'YES', 'TANK',          '2 KW', 2, true),
  ('I', 9, 'RAYZON',    545, 11, 5.995, 'YES', 'TANK',          '2 KW', 2, true);

-- Daily cumulative meter reading (kWh), one per block per day
create table public.solar_readings (
  id             uuid primary key default gen_random_uuid(),
  block          text not null references public.solar_blocks(block) on update cascade,
  reading_date   date not null,                          -- India date of the reading
  reading_kwh    numeric(12,2) check (reading_kwh is null or reading_kwh >= 0),
  not_read_reason text check (not_read_reason in ('LOCKED','METER_FAULT','DISPLAY_OFF','OTHER')),
  read_at        timestamptz not null default now(),     -- "Reading time" — SERVER time
  guard_id       uuid references public.guards(id) on delete set null,
  entered_by     uuid references auth.users(id) on delete set null,
  source         text not null default 'guard' check (source in ('guard','admin')),
  photo_path     text,
  photo_deleted  boolean not null default false,
  remarks        text,
  flags          text[] not null default '{}',
  prev_kwh       numeric(12,2),                          -- previous reading at the time of entry
  prev_date      date,
  updated_at     timestamptz,
  unique (block, reading_date),
  check (reading_kwh is not null or not_read_reason is not null)
);
create index on public.solar_readings (reading_date);

-- Every change to a saved reading is kept
create table public.solar_reading_history (
  id         uuid primary key default gen_random_uuid(),
  reading_id uuid not null references public.solar_readings(id) on delete cascade,
  old_kwh    numeric(12,2),
  new_kwh    numeric(12,2),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  note       text
);

-- Which evening alerts were sent (so each goes once per day)
create table public.solar_notify_log (
  day  date not null,
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (day, kind)
);

insert into public.app_settings (key, value, note) values
  ('solar_window_start',        '17:30', 'Guards can enter the evening solar reading from this time'),
  ('solar_window_end',          '21:30', 'Readings after this time are marked LATE (still accepted)'),
  ('solar_photo_required',      'yes',   'yes = guard must take a meter photo with every reading'),
  ('solar_max_kwh_per_kw_day',  '7',     'Units per day above this × kW installed are flagged HIGH (normal is about 4–5)'),
  ('solar_reminders',           'off',   'on = phone alert to guards at reading time and 30 min before the window ends')
on conflict (key) do nothing;

-- Daily generation = today's reading − previous reading (like the Daily Generation sheet).
-- is_check = reading went DOWN (meter reset / wrong reading). gap_days > 1 = previous day missing.
create or replace view public.solar_daily with (security_invoker = true) as
select r.id, r.block, r.reading_date, r.reading_kwh, r.read_at, r.guard_id, r.source, r.flags, r.remarks,
       r.photo_path, r.photo_deleted, r.not_read_reason, b.kw_installed,
       lag(r.reading_kwh)  over w as prev_kwh_calc,
       lag(r.reading_date) over w as prev_date_calc,
       r.reading_date - lag(r.reading_date) over w as gap_days,
       case when lag(r.reading_kwh) over w is null then null
            when r.reading_kwh < lag(r.reading_kwh) over w then null
            else r.reading_kwh - lag(r.reading_kwh) over w end as gen_kwh,
       coalesce(r.reading_kwh < lag(r.reading_kwh) over w, false) as is_check
  from public.solar_readings r
  join public.solar_blocks b on b.block = r.block
 where r.reading_kwh is not null
window w as (partition by r.block order by r.reading_date);

-- ---------------------------------------------------------------------
-- Guard functions
-- ---------------------------------------------------------------------
create or replace function public.solar_today() returns json
language plpgsql security definer set search_path = public as $$
declare
  tz    text := coalesce(public.setting('timezone'), 'Asia/Kolkata');
  today date := (now() at time zone tz)::date;
  nowt  time := (now() at time zone tz)::time;
  ws    time := coalesce(public.setting('solar_window_start'), '17:30')::time;
  we    time := coalesce(public.setting('solar_window_end'), '21:30')::time;
begin
  if not public.is_active_guard() and not public.is_admin() then raise exception 'Not allowed'; end if;
  return json_build_object(
    'server_now', now(), 'date', today, 'window_start', to_char(ws, 'HH24:MI'), 'window_end', to_char(we, 'HH24:MI'),
    'open', nowt >= ws, 'late', nowt > we,
    'photo_required', coalesce(public.setting('solar_photo_required'), 'yes') = 'yes',
    'max_per_kw', coalesce(public.setting('solar_max_kwh_per_kw_day'), '7')::numeric,
    'blocks', coalesce((select json_agg(json_build_object(
        'block', b.block, 'kw', b.kw_installed, 'area', b.area_served, 'brand', b.panel_brand,
        'panels', b.panel_count, 'meter_location', b.meter_location,
        'prev_kwh', p.reading_kwh, 'prev_date', p.reading_date,
        'today', case when t.id is null then null else json_build_object(
            'kwh', t.reading_kwh, 'reason', t.not_read_reason, 'read_at', t.read_at, 'remarks', t.remarks,
            'flags', t.flags, 'source', t.source, 'mine', t.guard_id = auth.uid()) end)
        order by b.block)
      from public.solar_blocks b
      left join public.solar_readings t on t.block = b.block and t.reading_date = today
      left join lateral (select reading_kwh, reading_date from public.solar_readings x
                          where x.block = b.block and x.reading_date < today and x.reading_kwh is not null
                          order by x.reading_date desc limit 1) p on true
     where b.active), '[]'::json)
  );
end $$;

create or replace function public.submit_solar_reading(
  p_block text, p_kwh numeric, p_reason text, p_photo_path text, p_remarks text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  tz     text := coalesce(public.setting('timezone'), 'Asia/Kolkata');
  today  date := (now() at time zone tz)::date;
  nowt   time := (now() at time zone tz)::time;
  ws     time := coalesce(public.setting('solar_window_start'), '17:30')::time;
  we     time := coalesce(public.setting('solar_window_end'), '21:30')::time;
  maxk   numeric := coalesce(public.setting('solar_max_kwh_per_kw_day'), '7')::numeric;
  b      public.solar_blocks;
  ex     public.solar_readings;
  p_kwh_prev numeric; p_date_prev date;
  v_flags text[] := '{}';
  photo_ok boolean := false;
  gen    numeric;
  rid    uuid;
  done_n int; total_n int;
begin
  if not public.is_active_guard() then raise exception 'Not an active guard'; end if;
  select * into b from public.solar_blocks where block = upper(p_block) and active;
  if b.block is null then raise exception 'Unknown block'; end if;
  if nowt < ws then raise exception 'Solar reading starts at %', to_char(ws, 'HH24:MI'); end if;
  if p_kwh is null and (p_reason is null or p_reason not in ('LOCKED','METER_FAULT','DISPLAY_OFF','OTHER')) then
    raise exception 'Enter the reading or choose why it could not be read';
  end if;
  if p_kwh is not null and (p_kwh < 0 or p_kwh > 99999999) then raise exception 'Reading looks wrong'; end if;

  -- live meter photo: in this guard's folder, uploaded in the last 30 minutes
  if p_photo_path is not null then
    select exists (select 1 from storage.objects o where o.bucket_id = 'patrol-media' and o.name = p_photo_path
                     and o.name like (auth.uid()::text || '/solar/%') and o.created_at > now() - interval '30 minutes')
      into photo_ok;
  end if;
  if p_kwh is not null and not photo_ok and coalesce(public.setting('solar_photo_required'), 'yes') = 'yes' then
    raise exception 'Meter photo is required';
  end if;

  select reading_kwh, reading_date into p_kwh_prev, p_date_prev from public.solar_readings
   where block = b.block and reading_date < today and reading_kwh is not null
   order by reading_date desc limit 1;

  if nowt > we then v_flags := v_flags || 'LATE'::text; end if;
  if p_kwh is null then v_flags := v_flags || 'NOT_READ'::text;
  elsif p_kwh_prev is null then v_flags := v_flags || 'FIRST'::text;
  else
    gen := p_kwh - p_kwh_prev;
    if gen < 0 then
      v_flags := v_flags || 'LOWER'::text;
      if nullif(trim(p_remarks), '') is null then raise exception 'Reading is lower than the last one. Choose a reason.'; end if;
    elsif gen > maxk * b.kw_installed * greatest(today - p_date_prev, 1) then
      v_flags := v_flags || 'HIGH'::text;
    end if;
  end if;

  select * into ex from public.solar_readings where block = b.block and reading_date = today for update;
  if ex.id is not null then
    if ex.source = 'admin' then raise exception 'The committee has already entered this reading'; end if;
    insert into public.solar_reading_history (reading_id, old_kwh, new_kwh, changed_by, note)
    values (ex.id, ex.reading_kwh, p_kwh, auth.uid(), 'Guard re-entered');
    update public.solar_readings set reading_kwh = p_kwh, not_read_reason = case when p_kwh is null then p_reason end,
           read_at = now(), guard_id = auth.uid(), entered_by = auth.uid(),
           photo_path = case when photo_ok then p_photo_path else photo_path end,
           remarks = nullif(trim(p_remarks), ''), flags = v_flags, prev_kwh = p_kwh_prev, prev_date = p_date_prev, updated_at = now()
     where id = ex.id returning id into rid;
  else
    insert into public.solar_readings (block, reading_date, reading_kwh, not_read_reason, guard_id, entered_by, source,
                                       photo_path, remarks, flags, prev_kwh, prev_date)
    values (b.block, today, p_kwh, case when p_kwh is null then p_reason end, auth.uid(), auth.uid(), 'guard',
            case when photo_ok then p_photo_path end, nullif(trim(p_remarks), ''), v_flags, p_kwh_prev, p_date_prev)
    returning id into rid;
  end if;

  select count(*) filter (where t.id is not null), count(*) into done_n, total_n
    from public.solar_blocks bb left join public.solar_readings t on t.block = bb.block and t.reading_date = today
   where bb.active;

  return json_build_object('ok', true, 'block', b.block, 'gen', gen, 'flags', v_flags, 'server_time', now(),
                           'done', done_n, 'total', total_n);
end $$;

-- ---------------------------------------------------------------------
-- Committee functions
-- ---------------------------------------------------------------------
create or replace function public.admin_set_solar_reading(p_block text, p_date date, p_kwh numeric, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare ex public.solar_readings;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_kwh is not null and p_kwh < 0 then raise exception 'Reading looks wrong'; end if;
  select * into ex from public.solar_readings where block = upper(p_block) and reading_date = p_date for update;
  if ex.id is null then
    if p_kwh is null then return; end if;
    insert into public.solar_readings (block, reading_date, reading_kwh, entered_by, source, remarks, flags, read_at)
    values (upper(p_block), p_date, p_kwh, auth.uid(), 'admin', nullif(trim(p_note), ''), '{ADMIN}', now())
    returning * into ex;
    insert into public.solar_reading_history (reading_id, old_kwh, new_kwh, changed_by, note)
    values (ex.id, null, p_kwh, auth.uid(), coalesce(nullif(trim(p_note), ''), 'Entered by committee'));
  elsif p_kwh is null then
    delete from public.solar_readings where id = ex.id;
  else
    insert into public.solar_reading_history (reading_id, old_kwh, new_kwh, changed_by, note)
    values (ex.id, ex.reading_kwh, p_kwh, auth.uid(), coalesce(nullif(trim(p_note), ''), 'Corrected by committee'));
    update public.solar_readings
       set reading_kwh = p_kwh, not_read_reason = null, updated_at = now(), source = 'admin', entered_by = auth.uid(),
           flags = array_append(array_remove(flags, 'CORRECTED'), 'CORRECTED'),
           remarks = coalesce(nullif(trim(p_note), ''), remarks)
     where id = ex.id;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Security
-- ---------------------------------------------------------------------
alter table public.solar_blocks          enable row level security;
alter table public.solar_readings        enable row level security;
alter table public.solar_reading_history enable row level security;
alter table public.solar_notify_log      enable row level security;
create policy admin_all  on public.solar_blocks          for all    using (public.is_admin()) with check (public.is_admin());
create policy admin_read on public.solar_readings        for select using (public.is_admin());
create policy admin_read on public.solar_reading_history for select using (public.is_admin());
create policy admin_read on public.solar_notify_log      for select using (public.is_admin());

revoke all on function public.solar_today() from public, anon;
revoke all on function public.submit_solar_reading(text, numeric, text, text, text) from public, anon;
revoke all on function public.admin_set_solar_reading(text, date, numeric, text) from public, anon;
grant execute on function public.solar_today(), public.submit_solar_reading(text, numeric, text, text, text),
  public.admin_set_solar_reading(text, date, numeric, text) to authenticated;
