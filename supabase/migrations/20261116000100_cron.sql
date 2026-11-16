-- Create each day's rounds automatically (so a night nobody opened the app still shows as MISSED)
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;

select cron.schedule(
  'patrol-generate-rounds',
  '*/30 * * * *',
  $$ select public.generate_rounds(((now() at time zone 'Asia/Kolkata')::date) - 1,
                                   ((now() at time zone 'Asia/Kolkata')::date) + 1) $$
);
