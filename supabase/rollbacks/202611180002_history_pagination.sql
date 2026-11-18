-- Apply as one transaction, only after restoring the previous client and gateway.
-- Restores the previous RPC; does not delete application data. CORE-001 returns.
drop function public.upahgo_action(text,jsonb);
alter function upahgo_private.price_action(text,jsonb) rename to upahgo_action;
alter function upahgo_private.upahgo_action(text,jsonb) set schema public;
revoke all on function public.upahgo_action(text,jsonb) from public,anon;
grant execute on function public.upahgo_action(text,jsonb) to authenticated;
revoke all on all functions in schema upahgo_private from public,anon,authenticated;
