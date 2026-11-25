-- Evening solar reading alerts (only when setting solar_reminders = 'on'):
--   'solar'        at the start of the reading window, if readings are pending
--   'solar_remind' 30 minutes before the window ends, if still pending
create or replace function public.patrol_notify_tick() returns void
language plpgsql security definer set search_path = public as $$
declare
  r        record;
  v_url    text;
  v_secret text;
  tz       text := coalesce(public.setting('timezone'), 'Asia/Kolkata');
  today    date := (now() at time zone tz)::date;
  nowt     time := (now() at time zone tz)::time;
  ws       time := coalesce(public.setting('solar_window_start'), '17:30')::time;
  we       time := coalesce(public.setting('solar_window_end'), '21:30')::time;
  s_done   int; s_total int;
begin
  select value into v_url    from public.app_secrets where key = 'notify_url';
  select value into v_secret from public.app_secrets where key = 'notify_secret';
  if v_url is null or v_secret is null then return; end if;

  -- Patrol rounds
  for r in select id from public.rounds
            where notified_start_at is null
              and due_start <= now() and due_start > now() - interval '10 minutes' loop
    update public.rounds set notified_start_at = now() where id = r.id;
    perform net.http_post(url := v_url,
      body := jsonb_build_object('round_id', r.id, 'kind', 'start'),
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-patrol-secret', v_secret));
  end loop;

  for r in select rs.id from public.round_status rs join public.rounds ro on ro.id = rs.id
            where ro.notified_remind_at is null and rs.total > 0 and rs.done < rs.total
              and now() >= rs.due_end - interval '15 minutes' and now() < rs.due_end loop
    update public.rounds set notified_remind_at = now() where id = r.id;
    perform net.http_post(url := v_url,
      body := jsonb_build_object('round_id', r.id, 'kind', 'remind'),
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-patrol-secret', v_secret));
  end loop;

  -- Solar readings
  if coalesce(public.setting('solar_reminders'), 'off') = 'on' and nowt >= ws then
    select count(*) filter (where t.id is not null), count(*) into s_done, s_total
      from public.solar_blocks b left join public.solar_readings t on t.block = b.block and t.reading_date = today
     where b.active;
    if s_total > 0 and s_done < s_total then
      if nowt < ws + interval '20 minutes' then
        insert into public.solar_notify_log (day, kind) values (today, 'solar') on conflict do nothing;
        if found then
          perform net.http_post(url := v_url, body := jsonb_build_object('kind', 'solar', 'done', s_done, 'total', s_total),
            headers := jsonb_build_object('Content-Type', 'application/json', 'x-patrol-secret', v_secret));
        end if;
      end if;
      if nowt >= we - interval '30 minutes' and nowt < we then
        insert into public.solar_notify_log (day, kind) values (today, 'solar_remind') on conflict do nothing;
        if found then
          perform net.http_post(url := v_url, body := jsonb_build_object('kind', 'solar_remind', 'done', s_done, 'total', s_total),
            headers := jsonb_build_object('Content-Type', 'application/json', 'x-patrol-secret', v_secret));
        end if;
      end if;
    end if;
  end if;
end $$;
revoke all on function public.patrol_notify_tick() from public, anon, authenticated;
