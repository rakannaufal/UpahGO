begin;

alter function public.upahgo_action(text,jsonb) set schema upahgo_private;
alter function upahgo_private.upahgo_action(text,jsonb) rename to price_action;

create function public.upahgo_action(p_operation text,p_args jsonb default '{}'::jsonb) returns jsonb
 language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); a upahgo_private.accounts; p upahgo_private.profiles;
 c upahgo_private.contacts; g upahgo_private.agreements;
 secret text; expected bytea; obj uuid; target uuid; target_role text;
 cursor_id uuid; cursor_date timestamptz; status_filter text:=coalesce(p_args->>'filter','all');
begin
 if p_operation is null then raise exception 'INVALID_INPUT'; end if;
 if p_operation not in('contact','agreement','contacts','agreements','notifications') then
  return upahgo_private.price_action(p_operation,p_args);
 end if;
 if actor is null then raise exception 'UNAUTHENTICATED'; end if;
 select secret_hash into expected from upahgo_private.gateway_config where singleton;
 secret:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-upahgo-gateway','');
 if expected is null or length(secret)<32 or extensions.digest(secret,'sha256')<>expected then raise exception 'GATEWAY_NOT_CONFIGURED'; end if;
 if jsonb_typeof(p_args) is distinct from 'object' or octet_length(p_args::text)>16384 then raise exception 'INVALID_INPUT'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 insert into upahgo_private.accounts(id) values(actor) on conflict do nothing;
 select * into a from upahgo_private.accounts where id=actor;
 select * into p from upahgo_private.profiles where id=actor;
 if a.status<>'active' or (p.id is not null and p.status<>'active') then raise exception 'ACCOUNT_RESTRICTED'; end if;
 perform upahgo_private.limit_action(actor,'all',90);

 if p_operation in('contact','agreement') then
  perform upahgo_private.check_keys(p_args,array['id']);
  begin
   if jsonb_typeof(p_args->'id') is distinct from 'string' then raise exception 'INVALID_INPUT'; end if;
   obj:=(p_args->>'id')::uuid;
  exception when invalid_text_representation then raise exception 'INVALID_INPUT'; end;
  -- History remains available after a role change, a block or stale GPS. No phone is returned.
  if p_operation='contact' then
   select * into c from upahgo_private.contacts where id=obj and actor in(sender_id,receiver_id);
   if c.id is null then raise exception 'UNAVAILABLE'; end if;
   return upahgo_private.contact_json(c);
  end if;
  select * into g from upahgo_private.agreements where id=obj and actor in(worker_id,employer_id);
  if g.id is null then raise exception 'UNAVAILABLE'; end if;
  return upahgo_private.agreement_json(g)||jsonb_build_object('workContext',(select work_context from upahgo_private.agreement_details where agreement_id=g.id));
 end if;
 perform upahgo_private.check_keys(p_args,case p_operation
  when 'contacts' then array['after','filter','targetId','targetRole']
  when 'agreements' then array['after','filter'] else array['after'] end);
 if p_args ? 'filter' and (jsonb_typeof(p_args->'filter') is distinct from 'string' or status_filter not in('all','active','history')) then raise exception 'INVALID_INPUT'; end if;
 if p_args ? 'after' then
  perform upahgo_private.check_keys(p_args->'after',array['id','createdAt']);
  if jsonb_typeof(p_args->'after'->'id') is distinct from 'string' or jsonb_typeof(p_args->'after'->'createdAt') is distinct from 'string'
   or (p_args->'after'->>'createdAt') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$' then raise exception 'INVALID_INPUT'; end if;
  begin
   cursor_id:=(p_args->'after'->>'id')::uuid;
   cursor_date:=(p_args->'after'->>'createdAt')::timestamptz;
  exception when invalid_text_representation or invalid_datetime_format or datetime_field_overflow then raise exception 'INVALID_INPUT'; end;
 end if;
 if p_args ? 'targetId' or p_args ? 'targetRole' then
  if jsonb_typeof(p_args->'targetId') is distinct from 'string' or jsonb_typeof(p_args->'targetRole') is distinct from 'string' or p_args->>'targetRole' not in('worker','employer') then raise exception 'INVALID_INPUT'; end if;
  begin target:=(p_args->>'targetId')::uuid;
  exception when invalid_text_representation then raise exception 'INVALID_INPUT'; end;
  target_role:=p_args->>'targetRole';
 end if;
 if p.id is null then return '[]'::jsonb; end if;
 if p_operation='contacts' then
  return (select coalesce(jsonb_agg(upahgo_private.contact_json(x) order by x.created_at desc,x.id desc),'[]') from (
   select * from upahgo_private.contacts where actor in(sender_id,receiver_id)
    and (cursor_id is null or (created_at,id)<(cursor_date,cursor_id))
    and (status_filter='all' or (status_filter='active')=(status in('pending','accepted') and expires_at>now()))
    and (target is null or (sender_id=actor and receiver_id=target and sender_role=a.role and receiver_role=target_role)
      or (receiver_id=actor and sender_id=target and receiver_role=a.role and sender_role=target_role))
   order by created_at desc,id desc limit 100) x);
 elsif p_operation='agreements' then
  return (select coalesce(jsonb_agg(upahgo_private.agreement_json(x)||jsonb_build_object('workContext',(select work_context from upahgo_private.agreement_details where agreement_id=x.id)) order by x.created_at desc,x.id desc),'[]') from (
   select * from upahgo_private.agreements where actor in(worker_id,employer_id)
    and (cursor_id is null or (created_at,id)<(cursor_date,cursor_id))
    and (status_filter='all' or (status_filter='active')=(status in('proposed','agreed','completion_requested')))
   order by created_at desc,id desc limit 100) x);
 end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'body',x.body,'route',x.route,'read',x.is_read,'createdAt',x.created_at) order by x.created_at desc,x.id desc),'[]') from (
  select * from upahgo_private.notifications where recipient_id=actor
   and (cursor_id is null or (created_at,id)<(cursor_date,cursor_id))
  order by created_at desc,id desc limit 100) x);
end $$;

revoke all on function public.upahgo_action(text,jsonb) from public,anon;
grant execute on function public.upahgo_action(text,jsonb) to authenticated;
revoke all on all functions in schema upahgo_private from public,anon,authenticated;
commit;
