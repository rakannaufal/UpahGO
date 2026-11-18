begin;
create table upahgo_private.accounts (
 id uuid primary key references auth.users(id) on delete cascade,
 role text check(role in ('worker','employer')),
 intro_seen boolean not null default false, setup_done boolean not null default false,
 browse_area_id uuid references upahgo_private.areas(id),
 status text not null default 'active' check(status in ('active','restricted','deletion_requested'))
);
insert into upahgo_private.accounts(id,role,intro_seen,setup_done,browse_area_id,status)
 select id,role,true,true,area_id,status from upahgo_private.profiles;
create table upahgo_private.role_profiles (
 user_id uuid not null references upahgo_private.accounts(id) on delete cascade,
 role text not null check(role in ('worker','employer')), tags text[] not null, bio text not null,
 primary key(user_id,role)
);
insert into upahgo_private.role_profiles select id,role,tags,bio from upahgo_private.profiles;
alter table upahgo_private.accounts enable row level security;
alter table upahgo_private.role_profiles enable row level security;
revoke all on upahgo_private.accounts,upahgo_private.role_profiles from public,anon,authenticated;
alter table upahgo_private.deletion_requests drop constraint deletion_requests_user_id_fkey;
alter table upahgo_private.deletion_requests add foreign key(user_id) references upahgo_private.accounts(id);

-- The original API remains private; clients cannot bypass the new account gates.
alter function public.upahgo_action(text,jsonb) set schema upahgo_private;
alter function upahgo_private.upahgo_action(text,jsonb) rename to core_action;
revoke all on function upahgo_private.core_action(text,jsonb) from public,anon,authenticated;
create function upahgo_private.account_json(a upahgo_private.accounts) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',a.id,'role',a.role,'introSeen',a.intro_seen,'setupDone',a.setup_done,
 'browseAreaId',a.browse_area_id,'status',coalesce((select p.status from upahgo_private.profiles p where p.id=a.id and p.status<>'active'),a.status));
$$;
revoke all on function upahgo_private.account_json(upahgo_private.accounts) from public,anon,authenticated;

create function public.upahgo_action(p_operation text,p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); a upahgo_private.accounts; p upahgo_private.profiles;
 secret text; expected bytea; result jsonb; new_role text; area uuid; saved upahgo_private.role_profiles;
begin
 if actor is null then raise exception 'UNAUTHENTICATED'; end if;
 select secret_hash into expected from upahgo_private.gateway_config where singleton;
 secret:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-upahgo-gateway','');
 if expected is null or length(secret)<32 or extensions.digest(secret,'sha256')<>expected then raise exception 'GATEWAY_NOT_CONFIGURED'; end if;
 if jsonb_typeof(p_args) is distinct from 'object' or octet_length(p_args::text)>16384 then raise exception 'INVALID_INPUT'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 insert into upahgo_private.accounts(id) values(actor) on conflict do nothing;
 select * into a from upahgo_private.accounts where id=actor;
 select * into p from upahgo_private.profiles where id=actor;
 if p_operation<>'bootstrap' and (a.status<>'active' or (p.id is not null and p.status<>'active')) then raise exception 'ACCOUNT_RESTRICTED'; end if;

 if p_operation='bootstrap' then
  result:=upahgo_private.core_action(p_operation,p_args);
  return result||jsonb_build_object('account',upahgo_private.account_json(a));
 end if;
 if p_operation in ('onboarding','set_role','set_area','discover','profile') or (p.id is null and p_operation in ('contacts','agreements','notifications','request_deletion')) then
  perform upahgo_private.limit_action(actor,'all',90);
 end if;
 case p_operation
 when 'onboarding' then
  perform upahgo_private.check_keys(p_args,array['step']);
  if p_args->>'step'='intro' then update upahgo_private.accounts set intro_seen=true where id=actor returning * into a;
  elsif p_args->>'step'='profile' and a.role is not null then update upahgo_private.accounts set setup_done=true where id=actor returning * into a;
  else raise exception 'INVALID_INPUT'; end if;
  return upahgo_private.account_json(a);
 when 'set_role' then
  perform upahgo_private.check_keys(p_args,array['role']);
  new_role:=p_args->>'role';
  if new_role is null or new_role not in ('worker','employer') then raise exception 'INVALID_INPUT'; end if;
  if a.role is distinct from new_role then
   if p.id is not null then
    insert into upahgo_private.role_profiles values(actor,p.role,p.tags,p.bio)
     on conflict(user_id,role) do update set tags=excluded.tags,bio=excluded.bio;
    select * into saved from upahgo_private.role_profiles where user_id=actor and role=new_role;
    update upahgo_private.profiles set role=new_role,tags=coalesce(saved.tags,'{}'),bio=coalesce(saved.bio,''),updated_at=now() where id=actor;
   end if;
   delete from upahgo_private.presences where user_id=actor;
   update upahgo_private.accounts set role=new_role where id=actor returning * into a;
  end if;
  return upahgo_private.account_json(a);
 when 'set_area' then
  perform upahgo_private.check_keys(p_args,array['areaId']);
  area:=(p_args->>'areaId')::uuid;
  if area is null or not exists(select 1 from upahgo_private.areas where id=area and enabled) then raise exception 'AREA_REQUIRED'; end if;
  update upahgo_private.accounts set browse_area_id=area where id=actor returning * into a;
  return upahgo_private.account_json(a);
 when 'discover','profile' then
  if a.role is null then raise exception 'ROLE_REQUIRED'; end if;
  perform upahgo_private.check_keys(p_args,case when p_operation='profile' then array['id','role'] else array['areaId','role'] end);
  new_role:=p_args->>'role';
  if new_role is null or new_role not in ('worker','employer') then raise exception 'INVALID_INPUT'; end if;
  select coalesce(jsonb_agg(item),'[]') into result from (
   select jsonb_build_object('id',x.id,'name',x.name,'role',v.role,'areaId',ar.id,'areaLabel',ar.label,
    'latitude',ar.latitude,'longitude',ar.longitude,'tags',v.tags,'bio',x.bio,'expiresAt',v.expires_at) item
   from upahgo_private.presences v join upahgo_private.profiles x on x.id=v.user_id join upahgo_private.areas ar on ar.id=v.area_id
   where x.id<>actor and x.status='active' and v.expires_at>now() and ar.enabled and v.role=new_role
    and not upahgo_private.blocked(actor,x.id)
    and ((p_operation='profile' and x.id=(p_args->>'id')::uuid) or (p_operation='discover' and ar.id=(p_args->>'areaId')::uuid))
   order by v.updated_at desc,x.id limit 40
  ) q;
  if p_operation='profile' then
   if jsonb_array_length(result)=0 then raise exception 'UNAVAILABLE'; end if;
   return result->0;
  end if;
  return result;
 else null;
 end case;
 if p_operation in ('contacts','agreements','notifications') and p.id is null then
  perform upahgo_private.check_keys(p_args,'{}'); return '[]'::jsonb;
 end if;
 if p_operation='request_deletion' then
  perform upahgo_private.check_keys(p_args,array['confirm']);
  if p_args->'confirm' is distinct from 'true'::jsonb then raise exception 'CONSENT_REQUIRED'; end if;
  if p.id is not null then result:=upahgo_private.core_action(p_operation,p_args);
  else insert into upahgo_private.deletion_requests(user_id) values(actor) on conflict do nothing; end if;
  update upahgo_private.accounts set status='deletion_requested' where id=actor;
  return jsonb_build_object('ok',true);
 end if;
 if a.role is null then raise exception 'ROLE_REQUIRED'; end if;
 if p_operation='save_profile' then
  if p_args->>'role' is distinct from a.role then raise exception 'PROFILE_INVALID'; end if;
  result:=upahgo_private.core_action(p_operation,p_args);
  insert into upahgo_private.role_profiles values(actor,a.role,array(select jsonb_array_elements_text(result->'tags')),result->>'bio')
   on conflict(user_id,role) do update set tags=excluded.tags,bio=excluded.bio;
  update upahgo_private.accounts set setup_done=true where id=actor;
  return result;
 end if;
 if p_operation='request_contact' or (p_operation='respond_contact' and p_args->>'action'='accept') or (p_operation='visibility' and p_args->'enabled'='true'::jsonb) then
  if p.id is null or p.area_id is null or cardinality(p.tags)=0 then raise exception 'PROFILE_INCOMPLETE'; end if;
  if upahgo_private.phone(actor) is null then raise exception 'PHONE_REQUIRED'; end if;
  if p_operation='request_contact' and p_args->>'targetRole'=a.role then raise exception 'FORBIDDEN'; end if;
 end if;
 return upahgo_private.core_action(p_operation,p_args);
end $$;
revoke all on function public.upahgo_action(text,jsonb) from public,anon;
grant execute on function public.upahgo_action(text,jsonb) to authenticated;
comment on function public.upahgo_action(text,jsonb) is 'Gateway-only account/onboarding API. Browsing does not require a fabricated public profile. Active role never changes historical agreement participants.';
commit;
