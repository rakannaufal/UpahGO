begin;
create table upahgo_private.profile_photos (
 user_id uuid not null references auth.users on delete cascade, role text not null check(role in('worker','employer')),
 object_key text not null unique, status text not null default 'pending' check(status in('pending','approved','rejected')),
 created_at timestamptz not null default now(), primary key(user_id,role)
);
create table upahgo_private.media_cleanup (object_key text primary key, created_at timestamptz not null default now());
alter table upahgo_private.profile_photos enable row level security;
alter table upahgo_private.media_cleanup enable row level security;
-- No storage policies: only the server service role can read, upload or sign these objects.
do $$ begin
 if to_regclass('storage.buckets') is not null then
  insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
   values('profile-photos','profile-photos',false,1048576,array['image/jpeg']) on conflict(id) do nothing;
  if exists(select 1 from storage.buckets where id='profile-photos' and (public or file_size_limit is distinct from 1048576 or allowed_mime_types is distinct from array['image/jpeg'])) then raise exception 'Unsafe existing profile-photos bucket configuration'; end if;
 end if;
end $$;
create function public.upahgo_photo_replace(p_user uuid,p_role text,p_key text) returns text language plpgsql security definer set search_path='' as $$
declare old_key text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if not exists(select 1 from upahgo_private.accounts where id=p_user and role=p_role and status='active')
  or not exists(select 1 from upahgo_private.profiles where id=p_user and role=p_role and status='active') then raise exception 'ACCOUNT_RESTRICTED'; end if;
 if p_key is not null and p_key !~ ('^'||p_user::text||'/'||p_role||'/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') then raise exception 'PHOTO_INVALID'; end if;
 select object_key into old_key from upahgo_private.profile_photos where user_id=p_user and role=p_role;
 if old_key is not null then insert into upahgo_private.media_cleanup values(old_key,now()) on conflict do nothing; end if;
 if p_key is null then delete from upahgo_private.profile_photos where user_id=p_user and role=p_role;
 else insert into upahgo_private.profile_photos(user_id,role,object_key) values(p_user,p_role,p_key)
  on conflict(user_id,role) do update set object_key=excluded.object_key,status='pending',created_at=now(); end if;
 return old_key;
end $$;
revoke all on function public.upahgo_photo_replace(uuid,text,text) from public,anon,authenticated;
do $$ begin if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function public.upahgo_photo_replace(uuid,text,text) to service_role; end if; end $$;
alter function public.upahgo_action(text,jsonb) set schema upahgo_private;
alter function upahgo_private.upahgo_action(text,jsonb) rename to work_action;
create function public.upahgo_action(p_operation text,p_args jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; actor uuid:=auth.uid(); photo upahgo_private.profile_photos; target uuid; requested_role text; secret text; expected bytea;
begin
 if p_operation='photo_access' then
  if actor is null then raise exception 'UNAUTHENTICATED'; end if;
  select secret_hash into expected from upahgo_private.gateway_config where singleton;
  secret:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-upahgo-gateway','');
  if expected is null or length(secret)<32 or extensions.digest(secret,'sha256')<>expected then raise exception 'GATEWAY_NOT_CONFIGURED'; end if;
  if jsonb_typeof(p_args) is distinct from 'object' or octet_length(p_args::text)>16384 then raise exception 'INVALID_INPUT'; end if;
  if not exists(select 1 from upahgo_private.accounts where id=actor and status='active') then raise exception 'ACCOUNT_RESTRICTED'; end if;
  perform upahgo_private.check_keys(p_args,array['id','role']);
  target:=(p_args->>'id')::uuid; requested_role:=p_args->>'role';
  if target is null or requested_role is null or requested_role not in('worker','employer') then raise exception 'PHOTO_INVALID'; end if;
  if target<>actor then perform upahgo_private.work_action('profile',p_args); else perform upahgo_private.limit_action(actor,'all',90); end if;
  select * into photo from upahgo_private.profile_photos where user_id=target and role=requested_role;
  return jsonb_build_object('key',case when target=actor or photo.status='approved' then photo.object_key else null end,'status',case when target=actor then photo.status else null end);
 end if;
 result:=upahgo_private.work_action(p_operation,p_args);
 if p_operation='bootstrap' and result->'profile'<>'null'::jsonb then
  result:=jsonb_set(result,'{profile}',result->'profile'||jsonb_build_object('photoStatus',(select status from upahgo_private.profile_photos where user_id=actor and role=result->'profile'->>'role')));
 elsif p_operation='save_profile' then
  result:=result||jsonb_build_object('photoStatus',(select status from upahgo_private.profile_photos where user_id=actor and role=result->>'role'));
 elsif p_operation='profile' then
  result:=result||jsonb_build_object('photoReady',exists(select 1 from upahgo_private.profile_photos where user_id=(result->>'id')::uuid and role=result->>'role' and status='approved'));
 elsif p_operation='discover' then
  result:=(select coalesce(jsonb_agg(item||jsonb_build_object('photoReady',exists(select 1 from upahgo_private.profile_photos where user_id=(item->>'id')::uuid and role=item->>'role' and status='approved')) order by ordinal),'[]') from jsonb_array_elements(result) with ordinality e(item,ordinal));
 elsif p_operation='request_deletion' then
  insert into upahgo_private.media_cleanup select object_key,now() from upahgo_private.profile_photos where user_id=actor on conflict do nothing;
  delete from upahgo_private.profile_photos where user_id=actor;
 end if;
 return result;
end $$;
revoke all on function public.upahgo_action(text,jsonb) from public,anon;
grant execute on function public.upahgo_action(text,jsonb) to authenticated;
revoke all on all functions in schema upahgo_private from public,anon,authenticated;
comment on table upahgo_private.profile_photos is 'New and replaced photos stay private pending manual review. Signed links expire after 60 seconds; no automatic public approval.';
commit;
