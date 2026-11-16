-- Route start/end dates, photo/video choice per route and per place,
-- Hindi/Gujarati names, guard list for the login dropdown.

alter table public.checkpoints
  add column name_hi text, add column name_gu text,
  add column area_hi text, add column area_gu text;

alter table public.routes
  add column name_hi text, add column name_gu text,
  add column start_date date not null default ((now() at time zone 'Asia/Kolkata')::date),
  add column end_date date,
  add column media_mode text not null default 'auto' check (media_mode in ('auto','photo','video'));

alter table public.route_checkpoints
  add column media text not null default 'auto' check (media in ('auto','photo','video'));

-- Rounds only from the route's start date (and up to its end date, if set)
create or replace function public.generate_rounds(p_from date, p_to date) returns void
language plpgsql security definer set search_path = public as $$
declare
  tz text := coalesce(public.setting('timezone'), 'Asia/Kolkata');
  d  date;
begin
  d := p_from;
  while d <= p_to loop
    insert into public.rounds (schedule_id, route_id, round_date, due_start, due_end, assigned_guard)
    select s.id, s.route_id, d,
           (d + s.start_time) at time zone tz,
           ((d + s.start_time) at time zone tz) + make_interval(mins => s.window_minutes),
           s.guard_id
      from public.schedules s
      join public.routes r on r.id = s.route_id and r.active
                          and d >= r.start_date and (r.end_date is null or d <= r.end_date)
     where s.active and extract(dow from d)::smallint = any (s.days)
    on conflict (schedule_id, round_date) do nothing;
    d := d + 1;
  end loop;
end $$;
revoke all on function public.generate_rounds(date, date) from public, anon, authenticated;

-- If a route's dates or status change, drop its future rounds that have no scans (they get re-created)
create or replace function public.route_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.start_date is distinct from old.start_date or new.end_date is distinct from old.end_date
     or new.active is distinct from old.active then
    delete from public.rounds r
     where r.route_id = new.id and r.due_start > now()
       and not exists (select 1 from public.scans s where s.round_id = r.id);
  end if;
  return new;
end $$;
revoke all on function public.route_changed() from public, anon, authenticated;
create trigger routes_changed after update on public.routes
  for each row execute function public.route_changed();

-- Guard names for the login dropdown (code + name only, active guards only)
create or replace function public.guard_login_list() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('code', code, 'name', name) order by code), '[]'::json)
    from public.guards where active
$$;
revoke all on function public.guard_login_list() from public;
grant execute on function public.guard_login_list() to anon, authenticated;

-- After the QR is read: tells the app whether this place needs a photo or a video
create or replace function public.identify_qr(p_challenge_id uuid, p_qr text) returns json
language plpgsql security definer set search_path = public as $$
declare
  ch    public.challenges;
  r     public.rounds;
  cp_id uuid;
  rmode text;
  cmode text;
  v_media text;
begin
  select * into ch from public.challenges c where c.id = p_challenge_id and c.guard_id = auth.uid();
  if ch.id is null then raise exception 'Invalid scan session'; end if;
  if ch.used_at is not null or now() > ch.expires_at then
    return json_build_object('media_type', ch.media_type);
  end if;
  select * into r from public.rounds where id = ch.round_id;
  if p_qr like 'SSP1:%' then
    select c.id into cp_id from public.checkpoints c where c.qr_token = substr(p_qr, 6) and c.active;
  end if;
  select media_mode into rmode from public.routes where id = r.route_id;
  if cp_id is not null then
    select media into cmode from public.route_checkpoints where route_id = r.route_id and checkpoint_id = cp_id;
  end if;
  v_media := case when cmode in ('photo','video') then cmode
                  when rmode in ('photo','video') then rmode
                  else ch.media_type end;
  if v_media <> ch.media_type then
    update public.challenges set media_type = v_media where id = ch.id;
  end if;
  return json_build_object('media_type', v_media);
end $$;
revoke all on function public.identify_qr(uuid, text) from public, anon;
grant execute on function public.identify_qr(uuid, text) to authenticated;

-- Guard home now also returns Hindi/Gujarati names
create or replace function public.guard_home(p_device_id text) returns json
language plpgsql security definer set search_path = public as $$
declare
  g     public.guards;
  tz    text := coalesce(public.setting('timezone'), 'Asia/Kolkata');
  today date := (now() at time zone tz)::date;
  early int  := public.setting('early_start_minutes')::int;
  late  int  := public.setting('late_grace_minutes')::int;
  device_ok boolean;
begin
  select * into g from public.guards where id = auth.uid();
  if g.id is null then raise exception 'This login is not a guard'; end if;
  if not g.active then raise exception 'Guard account is inactive. Contact the committee.'; end if;

  if g.device_id is null and p_device_id is not null then
    update public.guards set device_id = p_device_id, device_bound_at = now() where id = g.id;
    g.device_id := p_device_id;
  end if;
  device_ok := g.device_id = p_device_id;

  perform public.generate_rounds(today - 1, today + 1);

  return json_build_object(
    'server_now', now(),
    'timezone',   tz,
    'guard',      json_build_object('code', g.code, 'name', g.name),
    'device_ok',  device_ok,
    'rounds', coalesce((
      select json_agg(x order by x.due_start) from (
        select r.id, r.due_start, r.due_end,
               ro.name as route_name, ro.name_hi as route_name_hi, ro.name_gu as route_name_gu,
               (now() >= r.due_start - make_interval(mins => early)
                and now() <= r.due_end + make_interval(mins => late)) as open_now,
               (select json_agg(json_build_object(
                         'id', c.id, 'name', c.name, 'name_hi', c.name_hi, 'name_gu', c.name_gu,
                         'area', c.area, 'area_hi', c.area_hi, 'area_gu', c.area_gu,
                         'seq', rc.seq, 'media', rc.media,
                         'done', exists (select 1 from public.scans s
                                          where s.round_id = r.id and s.checkpoint_id = c.id
                                            and s.status <> 'rejected'))
                       order by rc.seq)
                  from public.route_checkpoints rc
                  join public.checkpoints c on c.id = rc.checkpoint_id and c.active
                 where rc.route_id = r.route_id) as checkpoints
          from public.rounds r
          join public.routes ro on ro.id = r.route_id
         where (r.assigned_guard is null or r.assigned_guard = g.id)
           and r.due_end + make_interval(mins => late) >= now()
           and r.due_start <= now() + interval '12 hours'
      ) x), '[]'::json)
  );
end $$;
