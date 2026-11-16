revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.schedule_changed() from public, anon, authenticated;
revoke all on function public.setting(text) from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_active_guard() from public, anon;
grant execute on function public.is_admin(), public.is_active_guard() to authenticated;
alter function public.server_now() set search_path = public;
alter function public.geo_distance_m(double precision, double precision, double precision, double precision) set search_path = public;
