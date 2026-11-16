-- 1. "QR not working" check-in: compulsory 10-sec video + reason, always reviewed by the committee
-- 2. Push alert subscriptions (round start / reminder)

alter table public.scans add column reason text, add column note text;
alter table public.challenges add column manual boolean not null default false;
alter table public.rounds add column notified_start_at timestamptz, add column notified_remind_at timestamptz;

create or replace function public.start_manual(p_round_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare j jsonb;
begin
  j := public.start_scan(p_round_id)::jsonb;
  update public.challenges set media_type = 'video', manual = true where id = (j->>'challenge_id')::uuid;
  return (j || jsonb_build_object('media_type', 'video'))::json;
end $$;

create or replace function public.submit_manual(
  p_challenge_id uuid, p_checkpoint_id uuid, p_reason text, p_note text,
  p_lat double precision, p_lng double precision, p_accuracy double precision,
  p_device_id text, p_media_path text, p_user_agent text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  ch  public.challenges;
  tok text;
  res jsonb;
  sid uuid;
  s   public.scans;
begin
  select * into ch from public.challenges c where c.id = p_challenge_id and c.guard_id = auth.uid();
  if ch.id is null or not ch.manual then raise exception 'Invalid scan session'; end if;
  if p_reason is null or p_reason not in ('TORN','DIRTY','DARK','CAMERA','OTHER') then
    raise exception 'Choose a reason';
  end if;
  select c.qr_token into tok from public.checkpoints c where c.id = p_checkpoint_id and c.active;

  -- Same checks as a QR scan (route, duplicate, live video, GPS, timing, phone)
  res := public.submit_scan(p_challenge_id, 'SSP1:' || coalesce(tok, 'none'), p_lat, p_lng, p_accuracy,
                            p_device_id, p_media_path, 0, p_user_agent)::jsonb;

  select id into sid from public.scans where challenge_id = p_challenge_id order by scanned_at desc limit 1;
  update public.scans
     set flags  = array_prepend('NO_QR', flags),
         reason = p_reason,
         note   = left(nullif(trim(p_note), ''), 500),
         status = case when status = 'ok' then 'review' else status end
   where id = sid
  returning * into s;

  return (res || jsonb_build_object('flags', to_jsonb(s.flags), 'status', s.status,
           'message', case when s.status = 'rejected' then res->>'message' else 'Recorded — will be checked by committee' end))::json;
end $$;

revoke all on function public.start_manual(uuid) from public, anon;
revoke all on function public.submit_manual(uuid, uuid, text, text, double precision, double precision, double precision, text, text, text) from public, anon;
grant execute on function public.start_manual(uuid),
  public.submit_manual(uuid, uuid, text, text, double precision, double precision, double precision, text, text, text)
  to authenticated;

-- Push alerts
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  guard_id   uuid not null references public.guards(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  lang       text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy admin_read on public.push_subscriptions for select using (public.is_admin());

-- Server-only secrets (VAPID key, notify secret). No policies: only the server can read.
create table public.app_secrets (key text primary key, value text not null);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_lang text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active_guard() then raise exception 'Not an active guard'; end if;
  insert into public.push_subscriptions (guard_id, endpoint, p256dh, auth, lang)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, coalesce(nullif(p_lang, ''), 'en'))
  on conflict (endpoint) do update
    set guard_id = excluded.guard_id, p256dh = excluded.p256dh, auth = excluded.auth,
        lang = excluded.lang, updated_at = now();
end $$;
revoke all on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;
