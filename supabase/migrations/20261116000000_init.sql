-- =====================================================================
-- Serenity Space — Guard Patrol System
-- All times are recorded by the SERVER (now()). Phone clocks are ignored.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------
create table public.app_settings (
  key   text primary key,
  value text not null,
  note  text
);

insert into public.app_settings (key, value, note) values
  ('super_admin_email',     'CHANGE-ME@example.com', 'This login becomes admin automatically when created (set before first deploy)'),
  ('timezone',              'Asia/Kolkata',        'Used to turn round times into real timestamps'),
  ('media_mode',            'random',              'photo | video | random (server decides; guard cannot predict)'),
  ('video_percent',         '30',                  'When media_mode = random: % of scans that must be a 10-second video'),
  ('video_seconds',         '10',                  'Video length'),
  ('challenge_seconds',     '180',                 'Time allowed from opening the camera to submitting'),
  ('early_start_minutes',   '10',                  'Round can be started this many minutes before its time'),
  ('late_grace_minutes',    '30',                  'Scans accepted (flagged LATE) this long after the window closes'),
  ('min_gap_seconds',       '20',                  'Two checkpoints cannot be scanned closer together than this'),
  ('max_speed_mps',         '3',                   'Walking speed limit between checkpoints (metres/second)'),
  ('max_gps_accuracy_m',    '60',                  'GPS accuracy worse than this is noted as LOW_GPS'),
  ('media_retention_days',  '30',                  'Photos/videos older than this are deleted by the cleanup button');

create or replace function public.setting(k text) returns text
language sql stable security definer set search_path = public as
$$ select value from public.app_settings where key = k $$;

-- ---------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text,
  created_at timestamptz not null default now()
);

create table public.guards (
  id              uuid primary key references auth.users(id) on delete cascade,
  code            text not null unique,          -- e.g. G01 (used to log in)
  name            text not null,
  phone           text,
  agency          text,
  active          boolean not null default true,
  device_id       text,                          -- phone this guard is locked to
  device_bound_at timestamptz,
  created_at      timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

create or replace function public.is_active_guard() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.guards where id = auth.uid() and active) $$;

-- First admin is created automatically when the super-admin email signs up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = lower(public.setting('super_admin_email')) then
    insert into public.admins(user_id, name) values (new.id, 'Super admin')
    on conflict do nothing;
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Checkpoints, routes, schedules
-- ---------------------------------------------------------------------
create table public.checkpoints (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  area         text,
  lat          double precision,
  lng          double precision,
  radius_m     integer not null default 30,
  gps_required boolean not null default true,     -- switch off for basements / indoor spots
  qr_token     text not null unique default encode(extensions.gen_random_bytes(12), 'hex'),
  qr_version   integer not null default 1,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Every QR that was ever replaced. Scanning one of these = someone kept a copy.
create table public.checkpoint_old_tokens (
  token         text primary key,
  checkpoint_id uuid not null references public.checkpoints(id) on delete cascade,
  version       integer not null,
  retired_at    timestamptz not null default now()
);

create table public.routes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.route_checkpoints (
  route_id      uuid not null references public.routes(id) on delete cascade,
  checkpoint_id uuid not null references public.checkpoints(id) on delete cascade,
  seq           integer not null,
  primary key (route_id, checkpoint_id)
);

create table public.schedules (
  id             uuid primary key default gen_random_uuid(),
  route_id       uuid not null references public.routes(id) on delete cascade,
  start_time     time not null,                       -- local time, e.g. 23:00
  window_minutes integer not null default 45,         -- round must be finished within this
  days           smallint[] not null default '{0,1,2,3,4,5,6}',  -- 0 = Sunday
  guard_id       uuid references public.guards(id) on delete set null,  -- optional
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Rounds (one per schedule per day) and scans
-- ---------------------------------------------------------------------
create table public.rounds (
  id             uuid primary key default gen_random_uuid(),
  schedule_id    uuid references public.schedules(id) on delete set null,
  route_id       uuid not null references public.routes(id) on delete cascade,
  round_date     date not null,
  due_start      timestamptz not null,
  due_end        timestamptz not null,
  assigned_guard uuid references public.guards(id) on delete set null,
  started_by     uuid references public.guards(id) on delete set null,
  started_at     timestamptz,
  unique (schedule_id, round_date)
);
create index on public.rounds (due_start);

create table public.challenges (
  id         uuid primary key default gen_random_uuid(),
  guard_id   uuid not null references public.guards(id) on delete cascade,
  round_id   uuid not null references public.rounds(id) on delete cascade,
  code       text not null,                 -- shown live on camera & burned into media
  media_type text not null check (media_type in ('photo','video')),
  issued_at  timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at    timestamptz
);

create table public.scans (
  id            uuid primary key default gen_random_uuid(),
  round_id      uuid not null references public.rounds(id) on delete cascade,
  checkpoint_id uuid references public.checkpoints(id) on delete set null,
  guard_id      uuid not null references public.guards(id) on delete cascade,
  challenge_id  uuid references public.challenges(id) on delete set null,
  scanned_at    timestamptz not null default now(),   -- SERVER time, never phone time
  qr_version    integer,
  lat           double precision,
  lng           double precision,
  accuracy_m    double precision,
  distance_m    double precision,
  media_type    text,
  media_path    text,
  media_deleted boolean not null default false,
  qr_frames     integer,
  device_id     text,
  user_agent    text,
  flags         text[] not null default '{}',
  status        text not null check (status in ('ok','review','rejected')),
  review_note   text,
  reviewed_by   uuid references auth.users(id),
  reviewed_at   timestamptz
);
create index on public.scans (scanned_at);
create unique index scans_one_per_checkpoint on public.scans (round_id, checkpoint_id)
  where status <> 'rejected';

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.geo_distance_m(lat1 double precision, lng1 double precision,
                                                 lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
           power(sin(radians(lat2 - lat1) / 2), 2) +
           cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)))
$$;

create or replace function public.server_now() returns timestamptz
language sql stable as $$ select now() $$;

-- Create round instances from schedules (idempotent). Internal: run by cron and by ensure_rounds.
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
     where s.active and extract(dow from d)::smallint = any (s.days)
    on conflict (schedule_id, round_date) do nothing;
    d := d + 1;
  end loop;
end $$;
revoke all on function public.generate_rounds(date, date) from public, anon, authenticated;

-- Callable by logged-in users (guard app / admin dashboard)
create or replace function public.ensure_rounds(p_from date, p_to date) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  if p_to - p_from > 62 then raise exception 'Range too large'; end if;
  perform public.generate_rounds(p_from, p_to);
end $$;

-- When a schedule changes, drop its future rounds that have not started (they get re-created)
create or replace function public.schedule_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.rounds r
   where r.schedule_id = old.id and r.due_start > now()
     and not exists (select 1 from public.scans s where s.round_id = r.id);
  return coalesce(new, old);
end $$;
create trigger schedules_changed after update or delete on public.schedules
  for each row execute function public.schedule_changed();

-- ---------------------------------------------------------------------
-- Guard API
-- ---------------------------------------------------------------------
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

  -- Lock the account to the first phone it is used on
  if g.device_id is null and p_device_id is not null then
    update public.guards set device_id = p_device_id, device_bound_at = now() where id = g.id;
    g.device_id := p_device_id;
  end if;
  device_ok := g.device_id = p_device_id;

  perform public.ensure_rounds(today - 1, today + 1);

  return json_build_object(
    'server_now', now(),
    'timezone',   tz,
    'guard',      json_build_object('code', g.code, 'name', g.name),
    'device_ok',  device_ok,
    'rounds', coalesce((
      select json_agg(x order by x.due_start) from (
        select r.id, r.due_start, r.due_end, ro.name as route_name,
               (now() >= r.due_start - make_interval(mins => early)
                and now() <= r.due_end + make_interval(mins => late)) as open_now,
               (select json_agg(json_build_object(
                         'id', c.id, 'name', c.name, 'area', c.area, 'seq', rc.seq,
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

create or replace function public.start_scan(p_round_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare
  g     public.guards;
  r     public.rounds;
  early int := public.setting('early_start_minutes')::int;
  late  int := public.setting('late_grace_minutes')::int;
  mode  text := public.setting('media_mode');
  mtype text;
  ch    public.challenges;
begin
  select * into g from public.guards where id = auth.uid() and active;
  if g.id is null then raise exception 'Not an active guard'; end if;

  select * into r from public.rounds where id = p_round_id;
  if r.id is null then raise exception 'Round not found'; end if;
  if r.assigned_guard is not null and r.assigned_guard <> g.id then
    raise exception 'This round is assigned to another guard';
  end if;
  if now() < r.due_start - make_interval(mins => early) then
    raise exception 'This round has not started yet';
  end if;
  if now() > r.due_end + make_interval(mins => late) then
    raise exception 'This round is closed';
  end if;

  mtype := case
             when mode = 'video' then 'video'
             when mode = 'photo' then 'photo'
             when random() * 100 < public.setting('video_percent')::numeric then 'video'
             else 'photo'
           end;

  insert into public.challenges (guard_id, round_id, code, media_type, expires_at)
  values (g.id, r.id, lpad((floor(random() * 10000))::int::text, 4, '0'), mtype,
          now() + make_interval(secs => public.setting('challenge_seconds')::int))
  returning * into ch;

  return json_build_object(
    'challenge_id',  ch.id,
    'code',          ch.code,
    'media_type',    ch.media_type,
    'video_seconds', public.setting('video_seconds')::int,
    'server_now',    now(),
    'expires_at',    ch.expires_at,
    'guard_code',    g.code
  );
end $$;

create or replace function public.submit_scan(
  p_challenge_id uuid,
  p_qr           text,
  p_lat          double precision,
  p_lng          double precision,
  p_accuracy     double precision,
  p_device_id    text,
  p_media_path   text,
  p_qr_frames    integer,
  p_user_agent   text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  ch        public.challenges;
  g         public.guards;
  r         public.rounds;
  cp        public.checkpoints;
  old_tok   public.checkpoint_old_tokens;
  prev      record;
  v_flags   text[] := '{}';
  v_status  text := 'ok';
  v_token   text;
  dist      double precision;
  gap       double precision;
  next_seq  integer;
  my_seq    integer;
  done_n    integer;
  total_n   integer;
  media_ok  boolean;
  reject_reason text;
begin
  select * into ch from public.challenges c where c.id = p_challenge_id and c.guard_id = auth.uid() for update;
  if ch.id is null then raise exception 'Invalid scan session'; end if;
  if ch.used_at is not null then raise exception 'This scan session was already used'; end if;
  update public.challenges set used_at = now() where id = ch.id;

  select * into g from public.guards where id = ch.guard_id;
  select * into r from public.rounds where id = ch.round_id;

  -- 1. Session freshness (server clock)
  if now() > ch.expires_at then
    v_flags := v_flags || 'EXPIRED'::text; reject_reason := 'Took too long. Please scan again.';
  end if;

  -- 2. Which QR is this?
  v_token := case when p_qr like 'SSP1:%' then substr(p_qr, 6) else null end;
  if v_token is not null then
    select * into cp from public.checkpoints c where c.qr_token = v_token and c.active;
    if cp.id is null then
      select * into old_tok from public.checkpoint_old_tokens o where o.token = v_token;
    end if;
  end if;
  if cp.id is null then
    if old_tok.token is not null then
      v_flags := v_flags || 'OLD_QR'::text;
      reject_reason := 'This QR code is no longer valid. The committee has been notified.';
      select * into cp from public.checkpoints c where c.id = old_tok.checkpoint_id;
    else
      v_flags := v_flags || 'UNKNOWN_QR'::text;
      reject_reason := coalesce(reject_reason, 'This is not a Serenity Space patrol QR code.');
    end if;
  end if;

  -- 3. Is the checkpoint on this round's route?
  if cp.id is not null and reject_reason is null then
    select rc.seq into my_seq from public.route_checkpoints rc
     where rc.route_id = r.route_id and rc.checkpoint_id = cp.id;
    if my_seq is null then
      v_flags := v_flags || 'NOT_ON_ROUTE'::text; reject_reason := cp.name || ' is not part of this round.';
    elsif exists (select 1 from public.scans s where s.round_id = r.id
                    and s.checkpoint_id = cp.id and s.status <> 'rejected') then
      v_flags := v_flags || 'DUPLICATE'::text; reject_reason := cp.name || ' is already done for this round.';
    end if;
  end if;

  -- 4. Live photo/video must exist, belong to this guard AND this session,
  --    and have been uploaded after the session began (server time)
  select exists (
    select 1 from storage.objects o
     where o.bucket_id = 'patrol-media'
       and o.name = p_media_path
       and o.name like (ch.guard_id::text || '/' || ch.id::text || '%')
       and o.created_at >= ch.issued_at
  ) into media_ok;
  if not coalesce(media_ok, false) then
    v_flags := v_flags || 'NO_MEDIA'::text;
    reject_reason := coalesce(reject_reason, 'Photo/video did not upload. Please scan again.');
  end if;

  -- 5. Location check
  if cp.id is not null and cp.lat is not null then
    if p_lat is null then
      if cp.gps_required then v_flags := v_flags || 'NO_GPS'::text; end if;
    else
      dist := public.geo_distance_m(cp.lat, cp.lng, p_lat, p_lng);
      if cp.gps_required and dist - least(coalesce(p_accuracy, 0), 40) > cp.radius_m then
        v_flags := v_flags || 'OUT_OF_ZONE'::text;
      end if;
      if p_accuracy is not null and p_accuracy > public.setting('max_gps_accuracy_m')::numeric then
        v_flags := v_flags || 'LOW_GPS'::text;
      end if;
    end if;
  end if;

  -- 6. Timing: late, too fast after previous checkpoint, out of order
  if now() > r.due_end then v_flags := v_flags || 'LATE'::text; end if;

  if cp.id is not null and reject_reason is null then
    select s.scanned_at, c.lat, c.lng into prev
      from public.scans s join public.checkpoints c on c.id = s.checkpoint_id
     where s.round_id = r.id and s.status <> 'rejected'
     order by s.scanned_at desc limit 1;
    if prev.scanned_at is not null then
      gap := extract(epoch from now() - prev.scanned_at);
      if gap < public.setting('min_gap_seconds')::numeric then
        v_flags := v_flags || 'TOO_FAST'::text;
      elsif prev.lat is not null and cp.lat is not null and gap > 0
            and public.geo_distance_m(prev.lat, prev.lng, cp.lat, cp.lng) / gap
                > public.setting('max_speed_mps')::numeric then
        v_flags := v_flags || 'TOO_FAST'::text;
      end if;
    end if;

    select min(rc.seq) into next_seq
      from public.route_checkpoints rc join public.checkpoints c on c.id = rc.checkpoint_id and c.active
     where rc.route_id = r.route_id
       and not exists (select 1 from public.scans s where s.round_id = r.id
                         and s.checkpoint_id = rc.checkpoint_id and s.status <> 'rejected');
    if my_seq is not null and next_seq is not null and my_seq <> next_seq then
      v_flags := v_flags || 'OUT_OF_ORDER'::text;
    end if;
  end if;

  -- 7. Phone check
  if g.device_id is not null and p_device_id is distinct from g.device_id then
    v_flags := v_flags || 'OTHER_PHONE'::text;
  end if;

  -- Verdict
  if reject_reason is not null then
    v_status := 'rejected';
  elsif v_flags && array['NO_GPS','OUT_OF_ZONE','TOO_FAST','OTHER_PHONE','LATE']::text[] then
    v_status := 'review';
  end if;

  insert into public.scans (round_id, checkpoint_id, guard_id, challenge_id, qr_version,
                            lat, lng, accuracy_m, distance_m, media_type, media_path,
                            qr_frames, device_id, user_agent, flags, status)
  values (r.id, cp.id, g.id, ch.id,
          coalesce(old_tok.version, cp.qr_version),
          p_lat, p_lng, p_accuracy, round(dist::numeric, 1), ch.media_type,
          case when media_ok then p_media_path end,
          p_qr_frames, p_device_id, left(p_user_agent, 300), v_flags, v_status);

  if v_status <> 'rejected' and r.started_by is null then
    update public.rounds set started_by = g.id, started_at = now() where id = r.id;
  end if;

  select count(*) filter (where exists (select 1 from public.scans s where s.round_id = r.id
                                          and s.checkpoint_id = rc.checkpoint_id and s.status <> 'rejected')),
         count(*)
    into done_n, total_n
    from public.route_checkpoints rc join public.checkpoints c on c.id = rc.checkpoint_id and c.active
   where rc.route_id = r.route_id;

  return json_build_object(
    'status',      v_status,
    'flags',       v_flags,
    'message',     coalesce(reject_reason,
                    case when v_status = 'ok' then 'Recorded' else 'Recorded — will be checked by committee' end),
    'checkpoint',  cp.name,
    'server_time', now(),
    'done',        done_n,
    'total',       total_n
  );
end $$;

-- ---------------------------------------------------------------------
-- Admin API
-- ---------------------------------------------------------------------
create or replace function public.admin_rekey_checkpoint(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  insert into public.checkpoint_old_tokens (token, checkpoint_id, version)
    select qr_token, id, qr_version from public.checkpoints where id = p_id;
  update public.checkpoints
     set qr_token = encode(extensions.gen_random_bytes(12), 'hex'), qr_version = qr_version + 1
   where id = p_id;
end $$;

create or replace function public.admin_review_scan(p_id uuid, p_status text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_status not in ('ok','review','rejected') then raise exception 'Bad status'; end if;
  update public.scans set status = p_status, review_note = p_note,
         reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_id;
end $$;

create or replace function public.admin_reset_device(p_guard uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.guards set device_id = null, device_bound_at = null where id = p_guard;
end $$;

-- Round status as seen by the committee
create or replace view public.round_status with (security_invoker = true) as
select r.id, r.round_date, r.due_start, r.due_end, r.route_id, ro.name as route_name,
       r.assigned_guard, ag.name as assigned_guard_name,
       r.started_by, sg.name as started_by_name, r.started_at,
       t.total,
       coalesce(sc.done, 0)     as done,
       coalesce(sc.flagged, 0)  as flagged,
       coalesce(sc.rejected, 0) as rejected,
       sc.last_scan,
       case
         when t.total > 0 and coalesce(sc.done, 0) >= t.total then 'completed'
         when now() < r.due_start then 'upcoming'
         when now() <= r.due_end and coalesce(sc.done, 0) = 0 then 'due'
         when now() <= r.due_end then 'in_progress'
         when coalesce(sc.done, 0) = 0 then 'missed'
         else 'partial'
       end as status
  from public.rounds r
  join public.routes ro on ro.id = r.route_id
  left join public.guards ag on ag.id = r.assigned_guard
  left join public.guards sg on sg.id = r.started_by
  cross join lateral (
    select count(*)::int as total from public.route_checkpoints rc
      join public.checkpoints c on c.id = rc.checkpoint_id and c.active
     where rc.route_id = r.route_id) t
  left join lateral (
    select count(*) filter (where s.status <> 'rejected')::int as done,
           count(*) filter (where s.status = 'review')::int    as flagged,
           count(*) filter (where s.status = 'rejected')::int  as rejected,
           max(s.scanned_at) as last_scan
      from public.scans s where s.round_id = r.id) sc on true;

-- ---------------------------------------------------------------------
-- Row-level security: guards can touch NOTHING directly (only via the
-- functions above). Admins can manage everything.
-- ---------------------------------------------------------------------
alter table public.app_settings          enable row level security;
alter table public.admins                enable row level security;
alter table public.guards                enable row level security;
alter table public.checkpoints           enable row level security;
alter table public.checkpoint_old_tokens enable row level security;
alter table public.routes                enable row level security;
alter table public.route_checkpoints     enable row level security;
alter table public.schedules             enable row level security;
alter table public.rounds                enable row level security;
alter table public.challenges            enable row level security;
alter table public.scans                 enable row level security;

create policy admin_all on public.app_settings          for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.admins                for all using (public.is_admin()) with check (public.is_admin());
create policy admin_me  on public.admins                for select using (user_id = auth.uid());
create policy admin_all on public.guards                for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.checkpoints           for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.checkpoint_old_tokens for select using (public.is_admin());
create policy admin_all on public.routes                for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.route_checkpoints     for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.schedules             for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.rounds                for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.challenges            for select using (public.is_admin());
create policy admin_read on public.scans                for select using (public.is_admin());

revoke all on function public.guard_home(text)                 from public, anon;
revoke all on function public.start_scan(uuid)                 from public, anon;
revoke all on function public.submit_scan(uuid, text, double precision, double precision, double precision, text, text, integer, text) from public, anon;
revoke all on function public.ensure_rounds(date, date)        from public, anon;
revoke all on function public.admin_rekey_checkpoint(uuid)     from public, anon;
revoke all on function public.admin_review_scan(uuid, text, text) from public, anon;
revoke all on function public.admin_reset_device(uuid)         from public, anon;
grant execute on function public.guard_home(text), public.start_scan(uuid),
  public.submit_scan(uuid, text, double precision, double precision, double precision, text, text, integer, text),
  public.ensure_rounds(date, date), public.admin_rekey_checkpoint(uuid),
  public.admin_review_scan(uuid, text, text), public.admin_reset_device(uuid),
  public.is_admin(), public.is_active_guard(), public.server_now()
  to authenticated;

-- ---------------------------------------------------------------------
-- Storage for photos / videos (private)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('patrol-media', 'patrol-media', false, 15728640,
        array['image/jpeg','video/webm','video/mp4'])
on conflict (id) do nothing;

-- Guards may only ADD files inside their own folder; they can never read, replace or delete.
create policy patrol_media_guard_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'patrol-media'
              and (storage.foldername(name))[1] = auth.uid()::text
              and public.is_active_guard());

create policy patrol_media_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'patrol-media' and public.is_admin());

create policy patrol_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'patrol-media' and public.is_admin());
