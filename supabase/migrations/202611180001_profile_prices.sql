begin;

create table upahgo_private.profile_prices (
 user_id uuid not null references auth.users on delete cascade,
 role text not null check(role in('worker','employer')),
 amount integer not null check(amount between 1000 and 50000000),
 negotiable boolean not null default false,
 primary key(user_id,role)
);
alter table upahgo_private.profile_prices enable row level security;
revoke all on upahgo_private.profile_prices from public,anon,authenticated;

create function upahgo_private.price_json(p_user uuid,p_role text) returns jsonb
 language sql stable set search_path='' as $$
 select jsonb_build_object('priceAmount',(select amount from upahgo_private.profile_prices where user_id=p_user and role=p_role),
 'priceNegotiable',coalesce((select negotiable from upahgo_private.profile_prices where user_id=p_user and role=p_role),false));
$$;

alter function public.upahgo_action(text,jsonb) set schema upahgo_private;
alter function upahgo_private.upahgo_action(text,jsonb) rename to photo_action;

create function public.upahgo_action(p_operation text,p_args jsonb default '{}'::jsonb) returns jsonb
 language plpgsql security definer set search_path='' as $$
declare result jsonb; actor uuid:=auth.uid(); amount numeric; negotiable boolean;
begin
 if actor is null then raise exception 'UNAUTHENTICATED'; end if;
 if jsonb_typeof(p_args) is distinct from 'object' or octet_length(p_args::text)>16384 then raise exception 'INVALID_INPUT'; end if;
 -- Existing gates validate the actor, gateway, active role, keys and profile, holding the actor lock.
 result:=upahgo_private.photo_action(p_operation,case when p_operation='save_profile' then p_args-'priceAmount'-'priceNegotiable' else p_args end);
 if p_operation='save_profile' then
  if not (p_args ? 'priceAmount') and p_args ? 'priceNegotiable' then raise exception 'PRICE_INVALID'; end if;
  if p_args ? 'priceAmount' then
   if p_args ? 'priceNegotiable' and jsonb_typeof(p_args->'priceNegotiable') is distinct from 'boolean' then raise exception 'PRICE_INVALID'; end if;
   negotiable:=coalesce((p_args->>'priceNegotiable')::boolean,false);
   if p_args->'priceAmount'='null'::jsonb then
    if negotiable then raise exception 'PRICE_INVALID'; end if;
    delete from upahgo_private.profile_prices where user_id=actor and role=result->>'role';
   else
    if jsonb_typeof(p_args->'priceAmount') is distinct from 'number' then raise exception 'PRICE_INVALID'; end if;
    amount:=(p_args->>'priceAmount')::numeric;
    if amount<1000 or amount>50000000 or amount<>trunc(amount) then raise exception 'PRICE_INVALID'; end if;
    insert into upahgo_private.profile_prices values(actor,result->>'role',amount::integer,negotiable)
     on conflict(user_id,role) do update set amount=excluded.amount,negotiable=excluded.negotiable;
   end if;
  end if;
 end if;
 if p_operation='bootstrap' and result->'profile'<>'null'::jsonb then
  result:=jsonb_set(result,'{profile}',result->'profile'||upahgo_private.price_json(actor,result->'profile'->>'role'));
 elsif p_operation in('save_profile','profile') then
  result:=result||upahgo_private.price_json((result->>'id')::uuid,result->>'role');
 elsif p_operation='discover' then
  result:=(select coalesce(jsonb_agg(item||upahgo_private.price_json((item->>'id')::uuid,item->>'role') order by ordinal),'[]')
   from jsonb_array_elements(result) with ordinality e(item,ordinal));
 end if;
 return result;
end $$;

revoke all on function public.upahgo_action(text,jsonb) from public,anon;
grant execute on function public.upahgo_action(text,jsonb) to authenticated;
revoke all on all functions in schema upahgo_private from public,anon,authenticated;
comment on table upahgo_private.profile_prices is 'Owner-provided initial price per task/session, isolated by active role. Not an agreed wage or payment record.';
commit;
