-- Route start = date + time; no two ACTIVE routes with the same name, start date and start time;
-- deactivating a route removes its upcoming / still-open rounds that have no scans (history is kept).

alter table public.routes add column start_time time not null default '00:00';

create unique index routes_unique_active on public.routes (lower(btrim(name)), start_date, start_time) where active;

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
                          and ((d + s.start_time) at time zone tz) >= ((r.start_date + r.start_time) at time zone tz)
                          and (r.end_date is null or d <= r.end_date)
     where s.active and extract(dow from d)::smallint = any (s.days)
    on conflict (schedule_id, round_date) do nothing;
    d := d + 1;
  end loop;
end $$;
revoke all on function public.generate_rounds(date, date) from public, anon, authenticated;

create or replace function public.route_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.active is distinct from old.active and not new.active then
    -- deactivated: drop upcoming and still-open rounds that nobody has scanned
    delete from public.rounds r
     where r.route_id = new.id and r.due_end > now()
       and not exists (select 1 from public.scans s where s.round_id = r.id);
  elsif new.start_date is distinct from old.start_date or new.start_time is distinct from old.start_time
        or new.end_date is distinct from old.end_date or new.active is distinct from old.active then
    delete from public.rounds r
     where r.route_id = new.id and r.due_start > now()
       and not exists (select 1 from public.scans s where s.round_id = r.id);
  end if;
  return new;
end $$;
revoke all on function public.route_changed() from public, anon, authenticated;
