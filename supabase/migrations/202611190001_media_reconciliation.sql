begin;
create function upahgo_private.valid_media_key(k text) returns boolean language sql immutable set search_path='' as $$
 select coalesce(k ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(worker|employer)/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',false);
$$;
create table upahgo_private.media_cleanup_config (
 singleton boolean primary key default true check(singleton), enabled boolean not null default false,
 approved_by text, approved_at timestamptz,
 check(not enabled or (approved_by is not null and approved_at is not null))
);
insert into upahgo_private.media_cleanup_config(singleton) values(true);
create table upahgo_private.media_uploads (
 object_key text primary key check(upahgo_private.valid_media_key(object_key)),
 user_id uuid not null references auth.users on delete cascade, role text not null check(role in('worker','employer')),
 expires_at timestamptz not null default now()+interval '15 minutes',
 check(split_part(object_key,'/',1)=user_id::text and split_part(object_key,'/',2)=role)
);
create index media_upload_owner on upahgo_private.media_uploads(user_id);
alter table upahgo_private.media_cleanup
 add column status text not null default 'pending' check(status in('pending','deleting','completed','failed','protected')),
 add column attempts integer not null default 0,
 add column lease uuid, add column lease_until timestamptz,
 add column next_attempt_at timestamptz not null default now(),
 add column completed_at timestamptz,
 add column last_error text check(last_error in('STORAGE_FAILED','DATABASE_FAILED','INVALID_STORAGE_KEY'));
create index media_cleanup_due on upahgo_private.media_cleanup(next_attempt_at) where status in('pending','deleting');
alter table upahgo_private.media_uploads enable row level security;
alter table upahgo_private.media_cleanup_config enable row level security;
revoke all on upahgo_private.media_uploads,upahgo_private.media_cleanup_config from public,anon,authenticated;

create function upahgo_private.queue_media_cleanup(k text) returns void language sql set search_path='' as $$
 insert into upahgo_private.media_cleanup(object_key) values(k)
 on conflict(object_key) do update set status='pending',attempts=0,lease=null,lease_until=null,completed_at=null,next_attempt_at=now(),last_error=null
 where upahgo_private.media_cleanup.status in('completed','protected');
$$;
create or replace function public.upahgo_photo_replace(p_user uuid,p_role text,p_key text) returns text language plpgsql security definer set search_path='' as $$
declare old_key text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if not exists(select 1 from upahgo_private.accounts where id=p_user and role=p_role and status='active')
  or not exists(select 1 from upahgo_private.profiles where id=p_user and role=p_role and status='active') then raise exception 'ACCOUNT_RESTRICTED'; end if;
 if p_key is not null and (not upahgo_private.valid_media_key(p_key) or split_part(p_key,'/',1)<>p_user::text or split_part(p_key,'/',2)<>p_role) then raise exception 'PHOTO_INVALID'; end if;
 select object_key into old_key from upahgo_private.profile_photos where user_id=p_user and role=p_role;
 -- A response lost after commit must not queue the currently active image.
 if p_key is not null and p_key=old_key then return null; end if;
 if p_key is not null and (not exists(select 1 from upahgo_private.media_uploads where object_key=p_key and user_id=p_user and role=p_role and expires_at>now())
  or exists(select 1 from upahgo_private.media_cleanup where object_key=p_key)) then raise exception 'PHOTO_UPLOAD_EXPIRED'; end if;
 if old_key is not null then perform upahgo_private.queue_media_cleanup(old_key); end if;
 if p_key is null then delete from upahgo_private.profile_photos where user_id=p_user and role=p_role;
 else
  insert into upahgo_private.profile_photos(user_id,role,object_key) values(p_user,p_role,p_key)
   on conflict(user_id,role) do update set object_key=excluded.object_key,status='pending',created_at=now();
  delete from upahgo_private.media_uploads where object_key=p_key;
 end if;
 return old_key;
end $$;

create function public.upahgo_media_admin(p_action text,p_args jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare subject uuid; requested_role text; k text; token uuid; job upahgo_private.media_cleanup; candidate record; n integer:=0;
begin
 if jsonb_typeof(p_args) is distinct from 'object' or octet_length(p_args::text)>16384 then raise exception 'INVALID_INPUT'; end if;
 if p_action='reserve' then
  perform upahgo_private.check_keys(p_args,array['userId','role']);
  subject:=(p_args->>'userId')::uuid; requested_role:=p_args->>'role';
  if subject is null or requested_role is null or requested_role not in('worker','employer') then raise exception 'INVALID_INPUT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(subject::text,0));
  if not exists(select 1 from upahgo_private.accounts where id=subject and role=requested_role and status='active')
   or not exists(select 1 from upahgo_private.profiles where id=subject and role=requested_role and status='active') then raise exception 'ACCOUNT_RESTRICTED'; end if;
  if (select count(*) from upahgo_private.media_uploads where user_id=subject and expires_at>now())>=20 then raise exception 'RATE_LIMITED'; end if;
  k:=subject::text||'/'||requested_role||'/'||extensions.gen_random_uuid()::text;
  insert into upahgo_private.media_uploads(object_key,user_id,role) values(k,subject,requested_role);
  return jsonb_build_object('key',k);
 end if;
 if p_action='stats' then
  perform upahgo_private.check_keys(p_args,array[]::text[]);
  return jsonb_build_object('enabled',(select enabled from upahgo_private.media_cleanup_config),
   'failed',(select count(*) from upahgo_private.media_cleanup where status='failed'),
   'pending',(select count(*) from upahgo_private.media_cleanup where status in('pending','deleting')),
   'overdue',(select count(*) from upahgo_private.media_cleanup where status in('pending','deleting') and created_at<now()-interval '24 hours'),
   'protected',(select count(*) from upahgo_private.media_cleanup where status='protected'),
   'invalidObjects',exists(select 1 from storage.objects where bucket_id='profile-photos' and (name !~ '\.jpg$' or not upahgo_private.valid_media_key(regexp_replace(name,'(-thumb)?\.jpg$','')))),
   'incompleteProfiles',(select count(*) from upahgo_private.profile_photos active_photo where
     not exists(select 1 from storage.objects where bucket_id='profile-photos' and name=active_photo.object_key||'.jpg')
     or not exists(select 1 from storage.objects where bucket_id='profile-photos' and name=active_photo.object_key||'-thumb.jpg')));
 end if;
 if not coalesce((select enabled from upahgo_private.media_cleanup_config where singleton),false) then raise exception 'MEDIA_CLEANUP_DISABLED'; end if;
 if p_action='maintain' then
  perform upahgo_private.check_keys(p_args,array[]::text[]);
  if not pg_try_advisory_xact_lock(hashtextextended('upahgo-media-maintenance',0)) then return jsonb_build_object('queued',0); end if;
  for candidate in select object_key,user_id from upahgo_private.media_uploads where expires_at<=now() order by expires_at,object_key limit 100 loop
   perform pg_advisory_xact_lock(hashtextextended(candidate.user_id::text,0));
   if not exists(select 1 from upahgo_private.profile_photos where object_key=candidate.object_key) then
    perform upahgo_private.queue_media_cleanup(candidate.object_key); n:=n+1;
   end if;
   delete from upahgo_private.media_uploads where object_key=candidate.object_key and expires_at<=now();
  end loop;
  -- Read Storage's catalog only. Object deletion always goes through its API.
  for candidate in select distinct regexp_replace(o.name,'(-thumb)?\.jpg$','') object_key
   from storage.objects o where o.bucket_id='profile-photos' and o.created_at<now()-interval '1 hour'
    and o.name ~ '\.jpg$' and upahgo_private.valid_media_key(regexp_replace(o.name,'(-thumb)?\.jpg$',''))
    and not exists(select 1 from upahgo_private.profile_photos where object_key=regexp_replace(o.name,'(-thumb)?\.jpg$',''))
    and not exists(select 1 from upahgo_private.media_uploads where object_key=regexp_replace(o.name,'(-thumb)?\.jpg$','') and expires_at>now())
    and not exists(select 1 from upahgo_private.media_cleanup where object_key=regexp_replace(o.name,'(-thumb)?\.jpg$','') and status in('pending','deleting','failed'))
   order by object_key limit 100 loop
   subject:=split_part(candidate.object_key,'/',1)::uuid;
   perform pg_advisory_xact_lock(hashtextextended(subject::text,0));
   if not exists(select 1 from upahgo_private.profile_photos where object_key=candidate.object_key)
    and not exists(select 1 from upahgo_private.media_uploads where object_key=candidate.object_key and expires_at>now()) then
    perform upahgo_private.queue_media_cleanup(candidate.object_key); n:=n+1;
   end if;
  end loop;
  delete from upahgo_private.media_cleanup where status='completed' and completed_at<now()-interval '30 days';
  return jsonb_build_object('queued',n);
 end if;
 if p_action='claim' then
  perform upahgo_private.check_keys(p_args,array[]::text[]);
  for candidate in select object_key from upahgo_private.media_cleanup where status in('pending','deleting') and next_attempt_at<=now() and (lease_until is null or lease_until<now()) order by next_attempt_at,object_key limit 25 loop
   k:=candidate.object_key;
   if not upahgo_private.valid_media_key(k) then
    update upahgo_private.media_cleanup set status='failed',last_error='INVALID_STORAGE_KEY',lease=null,lease_until=null where object_key=k; continue;
   end if;
   subject:=split_part(k,'/',1)::uuid;
   perform pg_advisory_xact_lock(hashtextextended(subject::text,0));
   select * into job from upahgo_private.media_cleanup where object_key=k and status in('pending','deleting') and next_attempt_at<=now() and (lease_until is null or lease_until<now()) for update skip locked;
   if not found then continue; end if;
   if exists(select 1 from upahgo_private.profile_photos where object_key=k) or exists(select 1 from upahgo_private.media_uploads where object_key=k and expires_at>now()) then
    update upahgo_private.media_cleanup set status='protected',lease=null,lease_until=null where object_key=k; continue;
   end if;
   update upahgo_private.media_cleanup set status='deleting',lease=extensions.gen_random_uuid(),lease_until=now()+interval '5 minutes',attempts=attempts+1 where object_key=k returning * into job;
   return jsonb_build_object('key',k,'lease',job.lease);
  end loop;
  return 'null'::jsonb;
 end if;
 perform upahgo_private.check_keys(p_args,case when p_action='fail' then array['key','lease','error'] else array['key','lease'] end);
 k:=p_args->>'key'; token:=(p_args->>'lease')::uuid;
 if not upahgo_private.valid_media_key(k) or token is null then raise exception 'INVALID_INPUT'; end if;
 subject:=split_part(k,'/',1)::uuid;
 perform pg_advisory_xact_lock(hashtextextended(subject::text,0));
 select * into job from upahgo_private.media_cleanup where object_key=k for update;
 if not found or job.status<>'deleting' or job.lease is distinct from token or job.lease_until<=now() then raise exception 'LEASE_EXPIRED'; end if;
 if p_action='done' then
  if exists(select 1 from upahgo_private.profile_photos where object_key=k) then raise exception 'MEDIA_ACTIVE'; end if;
  if exists(select 1 from storage.objects where bucket_id='profile-photos' and name in(k||'.jpg',k||'-thumb.jpg')) then raise exception 'STORAGE_STILL_EXISTS'; end if;
  update upahgo_private.media_cleanup set status='completed',completed_at=now(),last_error=null,lease=null,lease_until=null where object_key=k;
 elsif p_action='fail' then
  if p_args->>'error' is null or p_args->>'error' not in('STORAGE_FAILED','DATABASE_FAILED','INVALID_STORAGE_KEY') then raise exception 'INVALID_INPUT'; end if;
  update upahgo_private.media_cleanup set status=case when attempts>=12 then 'failed' else 'pending' end,last_error=p_args->>'error',lease=null,lease_until=null,
   next_attempt_at=now()+least(86400,30*power(2,least(attempts,12)))*interval '1 second' where object_key=k;
 else raise exception 'INVALID_INPUT'; end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.upahgo_media_admin(text,jsonb) from public,anon,authenticated;
do $$ begin if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function public.upahgo_media_admin(text,jsonb) to service_role; end if; end $$;
revoke all on all functions in schema upahgo_private from public,anon,authenticated;
commit;
