-- Every minute: tell guards when a round starts, and remind 15 minutes before it closes if unfinished.
create extension if not exists pg_net;

create or replace function public.patrol_notify_tick() returns void
language plpgsql security definer set search_path = public as $$
declare
  r        record;
  v_url    text;
  v_secret text;
begin
  select value into v_url    from public.app_secrets where key = 'notify_url';
  select value into v_secret from public.app_secrets where key = 'notify_secret';
  if v_url is null or v_secret is null then return; end if;

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
end $$;
revoke all on function public.patrol_notify_tick() from public, anon, authenticated;

select cron.schedule('patrol-notify', '* * * * *', $$ select public.patrol_notify_tick() $$);
