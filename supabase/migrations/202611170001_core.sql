begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists upahgo_private;
revoke all on schema upahgo_private from public, anon, authenticated;

create table upahgo_private.gateway_config (
  singleton boolean primary key default true check (singleton), secret_hash bytea
);
insert into upahgo_private.gateway_config(singleton) values (true);

create table upahgo_private.areas (
  id uuid primary key default gen_random_uuid(), label text not null check(length(label) between 3 and 120),
  latitude double precision not null check(latitude between -90 and 90),
  longitude double precision not null check(longitude between -180 and 180),
  timezone text not null check(timezone in ('Asia/Jakarta','Asia/Makassar','Asia/Jayapura')),
  enabled boolean not null default true
);
create table upahgo_private.tags (id text primary key, label text not null, enabled boolean not null default true);
insert into upahgo_private.tags(id,label) values
 ('sweep','Menyapu'),('mop','Mengepel'),('kitchen','Bersihkan dapur'),
 ('bathroom','Bersihkan kamar mandi'),('windows','Bersihkan jendela'),('dust','Lap debu');

create table upahgo_private.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(name) between 2 and 60), region text not null check(length(region) between 3 and 100),
 area_id uuid references upahgo_private.areas(id), role text not null check(role in ('worker','employer')),
 tags text[] not null default '{}', bio text not null default '' check(length(bio)<=240),
 status text not null default 'active' check(status in ('active','restricted','deletion_requested')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(cardinality(tags)<=5)
);
create table upahgo_private.presences (
 user_id uuid primary key references upahgo_private.profiles(id) on delete cascade,
 role text not null check(role in ('worker','employer')), area_id uuid not null references upahgo_private.areas(id),
 tags text[] not null check(cardinality(tags) between 1 and 5), expires_at timestamptz not null,
 updated_at timestamptz not null default now()
);
create index presence_area_role_expiry on upahgo_private.presences(area_id,role,expires_at);
create table upahgo_private.blocks (
 owner_id uuid not null references upahgo_private.profiles(id), target_id uuid not null references upahgo_private.profiles(id),
 created_at timestamptz not null default now(), primary key(owner_id,target_id), check(owner_id<>target_id)
);
create table upahgo_private.contacts (
 id uuid primary key default gen_random_uuid(), sender_id uuid not null references upahgo_private.profiles(id),
 receiver_id uuid not null references upahgo_private.profiles(id),
 sender_role text not null check(sender_role in ('worker','employer')), receiver_role text not null check(receiver_role in ('worker','employer')),
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled','revoked','expired')),
 sender_phone_hash bytea not null, receiver_phone_hash bytea,
 expires_at timestamptz not null default now()+interval '24 hours',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(sender_id<>receiver_id), check(sender_role<>receiver_role)
);
create unique index one_live_contact_pair on upahgo_private.contacts(least(sender_id,receiver_id),greatest(sender_id,receiver_id)) where status in ('pending','accepted');
create index contacts_sender_date on upahgo_private.contacts(sender_id,created_at desc);
create index contacts_receiver_date on upahgo_private.contacts(receiver_id,created_at desc);
create table upahgo_private.agreements (
 id uuid primary key default gen_random_uuid(), contact_id uuid not null references upahgo_private.contacts(id),
 creator_id uuid not null references upahgo_private.profiles(id), worker_id uuid not null references upahgo_private.profiles(id),
 employer_id uuid not null references upahgo_private.profiles(id),
 title text not null check(length(title) between 3 and 100), tasks text not null check(length(tasks) between 10 and 1000),
 wage integer not null check(wage between 1000 and 50000000), starts_at timestamptz not null,
 timezone text not null check(timezone in ('Asia/Jakarta','Asia/Makassar','Asia/Jayapura')),
 status text not null default 'proposed' check(status in ('proposed','agreed','completion_requested','completed','cancelled')),
 payment_received_at timestamptz, created_at timestamptz not null default now(),
 check(worker_id<>employer_id), check(creator_id in (worker_id,employer_id)),
 check(payment_received_at is null or status='completed')
);
create index agreements_worker_date on upahgo_private.agreements(worker_id,created_at desc);
create index agreements_employer_date on upahgo_private.agreements(employer_id,created_at desc);
create unique index one_active_agreement_contact on upahgo_private.agreements(contact_id) where status in ('proposed','agreed','completion_requested');
create table upahgo_private.reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null references upahgo_private.profiles(id),
 target_id uuid not null references upahgo_private.profiles(id), category text not null check(category in ('harassment','unsafe_work','unpaid','other')),
 detail text not null check(length(detail) between 10 and 1000), status text not null default 'received', created_at timestamptz not null default now()
);
create table upahgo_private.notifications (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null references upahgo_private.profiles(id),
 title text not null, body text not null, route text not null, is_read boolean not null default false,
 created_at timestamptz not null default now()
);
create index notices_recipient_date on upahgo_private.notifications(recipient_id,created_at desc);
create table upahgo_private.rate_buckets (
 actor_id uuid not null references auth.users(id) on delete cascade, operation text not null,
 window_id bigint not null, count integer not null, primary key(actor_id,operation,window_id)
);
create table upahgo_private.deletion_requests (
 user_id uuid primary key references upahgo_private.profiles(id), status text not null default 'requested', created_at timestamptz not null default now()
);

-- Private tables are absent from the public API and have no client grants/policies.
do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='upahgo_private' loop
  execute format('alter table upahgo_private.%I enable row level security',t.tablename);
  execute format('revoke all on upahgo_private.%I from public, anon, authenticated',t.tablename);
 end loop;
end $$;

create function upahgo_private.check_keys(a jsonb, allowed text[]) returns void language plpgsql set search_path='' as $$
begin
 if jsonb_typeof(a) is distinct from 'object' or exists(select 1 from jsonb_object_keys(a) k where not(k=any(allowed))) then
  raise exception 'INVALID_INPUT';
 end if;
end $$;
create function upahgo_private.blocked(a uuid,b uuid) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from upahgo_private.blocks where (owner_id=a and target_id=b) or (owner_id=b and target_id=a));
$$;
create function upahgo_private.phone(u uuid) returns text language sql stable set search_path='' as $$
 select case when phone ~ '^\+?[1-9][0-9]{7,14}$' and phone_confirmed_at is not null then phone end from auth.users where id=u;
$$;
create function upahgo_private.limit_action(u uuid,op text,lim integer) returns void language plpgsql set search_path='' as $$
declare n integer; w bigint:=floor(extract(epoch from clock_timestamp())/60); begin
 insert into upahgo_private.rate_buckets values(u,op,w,1)
 on conflict(actor_id,operation,window_id) do update set count=upahgo_private.rate_buckets.count+1 returning count into n;
 if n>lim then raise exception 'RATE_LIMITED'; end if;
 delete from upahgo_private.rate_buckets where actor_id=u and window_id<w-1440;
end $$;
create function upahgo_private.profile_json(p upahgo_private.profiles) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',p.id,'name',p.name,'region',p.region,'areaId',p.area_id,'role',p.role,'tags',p.tags,'bio',p.bio,
 'status',p.status,'whatsappReady',upahgo_private.phone(p.id) is not null,
 'visibleUntil',(select expires_at from upahgo_private.presences where user_id=p.id and expires_at>now()));
$$;
create function upahgo_private.contact_json(c upahgo_private.contacts) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',c.id,'senderId',c.sender_id,'receiverId',c.receiver_id,'senderRole',c.sender_role,'receiverRole',c.receiver_role,
 'senderName',(select name from upahgo_private.profiles where id=c.sender_id),'receiverName',(select name from upahgo_private.profiles where id=c.receiver_id),
 'status',case when c.status in ('pending','accepted') and c.expires_at<=now() then 'expired' else c.status end,'expiresAt',c.expires_at,'createdAt',c.created_at);
$$;
create function upahgo_private.agreement_json(g upahgo_private.agreements) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',g.id,'contactId',g.contact_id,'workerId',g.worker_id,'employerId',g.employer_id,'creatorId',g.creator_id,
 'workerName',(select name from upahgo_private.profiles where id=g.worker_id),'employerName',(select name from upahgo_private.profiles where id=g.employer_id),
 'title',g.title,'tasks',g.tasks,'wage',g.wage,'startsAt',g.starts_at,'timezone',g.timezone,'status',g.status,'paymentReceivedAt',g.payment_received_at,'createdAt',g.created_at);
$$;
create function upahgo_private.notice(u uuid,t text,b text,r text) returns void language sql set search_path='' as $$
 insert into upahgo_private.notifications(recipient_id,title,body,route) values(u,t,b,r);
$$;

create function public.upahgo_action(p_operation text,p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); p upahgo_private.profiles; target upahgo_private.profiles;
 c upahgo_private.contacts; g upahgo_private.agreements; a upahgo_private.areas;
 secret text; expected bytea; result jsonb; requested_tags text[]; role_value text;
 obj uuid; target_id uuid; action text; phone_value text;
begin
 if actor is null then raise exception 'UNAUTHENTICATED'; end if;
 select secret_hash into expected from upahgo_private.gateway_config where singleton;
 secret:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-upahgo-gateway','');
 if expected is null or length(secret)<32 or extensions.digest(secret,'sha256')<>expected then raise exception 'GATEWAY_NOT_CONFIGURED'; end if;
 if jsonb_typeof(p_args) is distinct from 'object' or octet_length(p_args::text)>16384 then raise exception 'INVALID_INPUT'; end if;
 -- All operations for one actor serialize, including concurrent first profile/limit writes.
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 perform upahgo_private.limit_action(actor,'all',90);
 select * into p from upahgo_private.profiles where id=actor;
 if p.id is not null and p.status<>'active' and p_operation<>'bootstrap' then raise exception 'ACCOUNT_RESTRICTED'; end if;

 case p_operation
 when 'bootstrap' then
  perform upahgo_private.check_keys(p_args,'{}');
  return jsonb_build_object('profile',case when p.id is not null then upahgo_private.profile_json(p) else null end,
   'areas',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label,'latitude',latitude,'longitude',longitude,'timezone',timezone) order by label),'[]') from upahgo_private.areas where enabled),
   'tags',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label) order by label),'[]') from upahgo_private.tags where enabled));
 when 'save_profile' then
  perform upahgo_private.check_keys(p_args,array['name','region','areaId','role','tags','bio']);
  role_value:=p_args->>'role';
  if jsonb_typeof(p_args->'name') is distinct from 'string' or jsonb_typeof(p_args->'region') is distinct from 'string'
   or jsonb_typeof(p_args->'tags') is distinct from 'array' or jsonb_typeof(p_args->'bio') is distinct from 'string'
   or exists(select 1 from jsonb_array_elements(p_args->'tags') t where jsonb_typeof(t)<>'string') then raise exception 'PROFILE_INVALID'; end if;
  select coalesce(array_agg(t),'{}') into requested_tags from jsonb_array_elements_text(p_args->'tags') t;
  if coalesce(length(trim(p_args->>'name')),0) not between 2 and 60 or (p_args->>'name') ~* '(https?:|[0-9]{5})'
   or coalesce(length(trim(p_args->>'region')),0) not between 3 and 100 or length(coalesce(p_args->>'bio',''))>240
   or role_value not in ('worker','employer') or role_value is null then raise exception 'PROFILE_INVALID'; end if;
  if coalesce(p_args->>'bio','') ~* '(https?:|\+?[0-9][0-9 ()-]{7,})' then raise exception 'PUBLIC_CONTACT_FORBIDDEN'; end if;
  if cardinality(requested_tags)>5 or cardinality(requested_tags)<>(select count(distinct t) from unnest(requested_tags) t)
   or exists(select 1 from unnest(requested_tags) t where not exists(select 1 from upahgo_private.tags where id=t and enabled)) then raise exception 'TAGS_INVALID'; end if;
  if cardinality(requested_tags)=0 and exists(select 1 from upahgo_private.presences where user_id=actor and expires_at>now()) then raise exception 'TAGS_REQUIRED'; end if;
  obj:=nullif(p_args->>'areaId','')::uuid;
  if obj is not null and not exists(select 1 from upahgo_private.areas where id=obj and enabled) then raise exception 'AREA_REQUIRED'; end if;
  insert into upahgo_private.profiles(id,name,region,area_id,role,tags,bio)
  values(actor,trim(p_args->>'name'),trim(p_args->>'region'),obj,role_value,requested_tags,trim(coalesce(p_args->>'bio','')))
  on conflict(id) do update set name=excluded.name,region=excluded.region,area_id=excluded.area_id,role=excluded.role,tags=excluded.tags,bio=excluded.bio,updated_at=now()
  returning * into p;
  -- Editing area/role never silently activates or moves a public marker.
  delete from upahgo_private.presences where user_id=actor;
  return upahgo_private.profile_json(p);
 else null;
 end case;
 if p.id is null then raise exception 'PROFILE_INVALID'; end if;

 case p_operation
 when 'visibility' then
  perform upahgo_private.check_keys(p_args,array['enabled']);
  if jsonb_typeof(p_args->'enabled') is distinct from 'boolean' then raise exception 'INVALID_INPUT'; end if;
  if (p_args->>'enabled')::boolean then
   if p.area_id is null or not exists(select 1 from upahgo_private.areas where id=p.area_id and enabled) then raise exception 'AREA_REQUIRED'; end if;
   if cardinality(p.tags)=0 then raise exception 'TAGS_REQUIRED'; end if;
   insert into upahgo_private.presences(user_id,role,area_id,tags,expires_at) values(actor,p.role,p.area_id,p.tags,now()+interval '1 hour')
   on conflict(user_id) do update set role=excluded.role,area_id=excluded.area_id,tags=excluded.tags,expires_at=excluded.expires_at,updated_at=now();
  else delete from upahgo_private.presences where user_id=actor;
  end if;
  return upahgo_private.profile_json(p);
 when 'discover','profile' then
  perform upahgo_private.check_keys(p_args,case when p_operation='profile' then array['id','role'] else array['areaId','role'] end);
  role_value:=p_args->>'role';
  if role_value not in ('worker','employer') or role_value is null then raise exception 'INVALID_INPUT'; end if;
  select coalesce(jsonb_agg(item),'[]') into result from (
   select jsonb_build_object('id',x.id,'name',x.name,'role',v.role,'areaId',ar.id,'areaLabel',ar.label,'latitude',ar.latitude,'longitude',ar.longitude,
    'tags',case when v.role='worker' then x.tags else v.tags end,'bio',x.bio,'expiresAt',v.expires_at) item
   from upahgo_private.presences v join upahgo_private.profiles x on x.id=v.user_id join upahgo_private.areas ar on ar.id=v.area_id
   where x.id<>actor and x.status='active' and v.expires_at>now() and ar.enabled and v.role=role_value and not upahgo_private.blocked(actor,x.id)
   and ((p_operation='profile' and x.id=(p_args->>'id')::uuid) or (p_operation='discover' and ar.id=(p_args->>'areaId')::uuid))
   order by v.updated_at desc limit 40
  ) q;
  if p_operation='profile' then
   if jsonb_array_length(result)=0 then raise exception 'UNAVAILABLE'; end if;
   return result->0;
  end if;
  return result;
 when 'contacts' then
  perform upahgo_private.check_keys(p_args,'{}');
  return (select coalesce(jsonb_agg(upahgo_private.contact_json(x) order by x.created_at desc),'[]') from
   (select * from upahgo_private.contacts where actor in(sender_id,receiver_id) order by created_at desc limit 100) x);
 when 'request_contact' then
  perform upahgo_private.check_keys(p_args,array['targetId','targetRole','consent']);
  if p_args->'consent' is distinct from 'true'::jsonb then raise exception 'CONSENT_REQUIRED'; end if;
  target_id:=(p_args->>'targetId')::uuid; role_value:=p_args->>'targetRole';
  if target_id=actor or target_id is null or role_value is null or role_value not in ('worker','employer') then raise exception 'FORBIDDEN'; end if;
  perform pg_advisory_xact_lock(hashtextextended(least(actor,target_id)::text||greatest(actor,target_id)::text,1));
  select * into target from upahgo_private.profiles where id=target_id and status='active';
  if target.id is null or upahgo_private.blocked(actor,target_id) or not exists(select 1 from upahgo_private.presences where user_id=target_id and role=role_value and expires_at>now()) then raise exception 'UNAVAILABLE'; end if;
  phone_value:=upahgo_private.phone(actor);
  if phone_value is null then raise exception 'PHONE_REQUIRED'; end if;
  if upahgo_private.phone(target_id) is null then raise exception 'TARGET_PHONE_REQUIRED'; end if;
  update upahgo_private.contacts set status='expired' where least(sender_id,receiver_id)=least(actor,target_id) and greatest(sender_id,receiver_id)=greatest(actor,target_id) and status in ('pending','accepted') and expires_at<=now();
  select * into c from upahgo_private.contacts where least(sender_id,receiver_id)=least(actor,target_id) and greatest(sender_id,receiver_id)=greatest(actor,target_id) and status in ('pending','accepted') for update;
  if c.id is not null then
   if c.sender_id<>actor and c.status='pending' then raise exception 'INCOMING_REQUEST'; end if;
   return upahgo_private.contact_json(c);
  end if;
  perform upahgo_private.limit_action(actor,'contact_create',5);
  if exists(select 1 from upahgo_private.contacts where sender_id=actor and receiver_id=target_id and created_at>now()-interval '24 hours') then raise exception 'RATE_LIMITED'; end if;
  insert into upahgo_private.contacts(sender_id,receiver_id,sender_role,receiver_role,sender_phone_hash)
  values(actor,target_id,case when role_value='worker' then 'employer' else 'worker' end,role_value,extensions.digest(phone_value,'sha256')) returning * into c;
  perform upahgo_private.notice(target_id,'Permintaan kontak baru','Tinjau sebelum membagikan nomor.','/contact/'||c.id);
  return upahgo_private.contact_json(c);
 when 'respond_contact','revoke_contact','approved_contact' then
  perform upahgo_private.check_keys(p_args,case when p_operation='respond_contact' then array['id','action','consent'] else array['id'] end);
  select * into c from upahgo_private.contacts where id=(p_args->>'id')::uuid and actor in(sender_id,receiver_id) for update;
  if c.id is null then raise exception 'UNAVAILABLE'; end if;
  target_id:=case when actor=c.sender_id then c.receiver_id else c.sender_id end;
  if p_operation='revoke_contact' then
   if c.status in ('pending','accepted') then
    update upahgo_private.contacts set status=case when c.status='pending' then 'cancelled' else 'revoked' end,updated_at=now() where id=c.id returning * into c;
   end if;
   return upahgo_private.contact_json(c);
  end if;
  if upahgo_private.blocked(actor,target_id) or not exists(select 1 from upahgo_private.profiles where id=target_id and status='active') then raise exception 'UNAVAILABLE'; end if;
  if c.expires_at<=now() then raise exception 'CONTACT_EXPIRED'; end if;
  if p_operation='approved_contact' then
   if c.status<>'accepted' then raise exception 'FORBIDDEN'; end if;
   if c.sender_phone_hash is distinct from extensions.digest(upahgo_private.phone(c.sender_id),'sha256') or c.receiver_phone_hash is distinct from extensions.digest(upahgo_private.phone(c.receiver_id),'sha256') then raise exception 'CONTACT_EXPIRED'; end if;
   return jsonb_build_object('phone',upahgo_private.phone(target_id));
  end if;
  if actor<>c.receiver_id then raise exception 'FORBIDDEN'; end if;
  action:=p_args->>'action';
  if action not in ('accept','decline') or action is null then raise exception 'INVALID_INPUT'; end if;
  if (action='accept' and c.status='accepted') or (action='decline' and c.status='declined') then return upahgo_private.contact_json(c); end if;
  if c.status<>'pending' then raise exception 'STATE_CONFLICT'; end if;
  if action='accept' then
   if p_args->'consent' is distinct from 'true'::jsonb then raise exception 'CONSENT_REQUIRED'; end if;
   phone_value:=upahgo_private.phone(actor);
   if phone_value is null then raise exception 'PHONE_REQUIRED'; end if;
   if c.sender_phone_hash is distinct from extensions.digest(upahgo_private.phone(c.sender_id),'sha256') then raise exception 'CONTACT_EXPIRED'; end if;
  end if;
  update upahgo_private.contacts set status=case when action='accept' then 'accepted' else 'declined' end,
   receiver_phone_hash=case when action='accept' then extensions.digest(phone_value,'sha256') else null end,
   expires_at=case when action='accept' then now()+interval '30 days' else expires_at end,updated_at=now() where id=c.id returning * into c;
  perform upahgo_private.notice(c.sender_id,'Permintaan kontak diperbarui','Buka aktivitas untuk melihat statusnya.','/contact/'||c.id);
  return upahgo_private.contact_json(c);
 when 'agreements' then
  perform upahgo_private.check_keys(p_args,'{}');
  return (select coalesce(jsonb_agg(upahgo_private.agreement_json(x) order by x.created_at desc),'[]') from
   (select * from upahgo_private.agreements where actor in(worker_id,employer_id) order by created_at desc limit 100) x);
 when 'create_agreement' then
  perform upahgo_private.check_keys(p_args,array['contactId','title','tasks','wage','startsAt','timezone']);
  select * into c from upahgo_private.contacts where id=(p_args->>'contactId')::uuid and actor in(sender_id,receiver_id) for update;
  if c.id is null or c.status<>'accepted' or c.expires_at<=now() or upahgo_private.blocked(c.sender_id,c.receiver_id) then raise exception 'FORBIDDEN'; end if;
  target_id:=case when actor=c.sender_id then c.receiver_id else c.sender_id end;
  if not exists(select 1 from upahgo_private.profiles where id=target_id and status='active') then raise exception 'UNAVAILABLE'; end if;
  select * into g from upahgo_private.agreements where contact_id=c.id and status in ('proposed','agreed','completion_requested');
  if g.id is not null then raise exception 'STATE_CONFLICT'; end if;
  if jsonb_typeof(p_args->'title') is distinct from 'string' or jsonb_typeof(p_args->'tasks') is distinct from 'string'
   or jsonb_typeof(p_args->'wage') is distinct from 'number' or p_args->>'startsAt' is null or p_args->>'timezone' is null
   or coalesce(length(trim(p_args->>'title')),0) not between 3 and 100 or coalesce(length(trim(p_args->>'tasks')),0) not between 10 and 1000
   or (p_args->>'wage') !~ '^[0-9]{4,8}$' or (p_args->>'wage')::bigint not between 1000 and 50000000
   or (p_args->>'startsAt')::timestamptz<=now() or (p_args->>'startsAt')::timestamptz>now()+interval '1 year'
   or (p_args->>'timezone') not in ('Asia/Jakarta','Asia/Makassar','Asia/Jayapura') then raise exception 'AGREEMENT_INVALID'; end if;
  insert into upahgo_private.agreements(contact_id,creator_id,worker_id,employer_id,title,tasks,wage,starts_at,timezone)
  values(c.id,actor,case when c.sender_role='worker' then c.sender_id else c.receiver_id end,
   case when c.sender_role='employer' then c.sender_id else c.receiver_id end,trim(p_args->>'title'),trim(p_args->>'tasks'),
   (p_args->>'wage')::integer,(p_args->>'startsAt')::timestamptz,p_args->>'timezone') returning * into g;
  perform upahgo_private.notice(target_id,'Tinjau kesepakatan kerja','Baca tugas, jadwal, dan upah tunai sebelum menerima.','/agreement/'||g.id);
  return upahgo_private.agreement_json(g);
 when 'agreement_action' then
  perform upahgo_private.check_keys(p_args,array['id','action']);
  select * into g from upahgo_private.agreements where id=(p_args->>'id')::uuid and actor in(worker_id,employer_id) for update;
  if g.id is null then raise exception 'UNAVAILABLE'; end if;
  action:=p_args->>'action';
  if action='accept' and actor<>g.creator_id and g.status='proposed' then
   -- Serialize acceptance for the worker; users review the schedule before accepting.
   perform pg_advisory_xact_lock(hashtextextended(g.worker_id::text,2));
   if g.starts_at<=now() then raise exception 'AGREEMENT_INVALID'; end if;
   g.status:='agreed';
  elsif action='request_completion' and actor=g.worker_id and g.status='agreed' then g.status:='completion_requested';
  elsif action='confirm_completion' and actor=g.employer_id and g.status='completion_requested' then g.status:='completed';
  elsif action='acknowledge_payment' and actor=g.worker_id and g.status='completed' then
   if g.payment_received_at is not null then return upahgo_private.agreement_json(g); end if;
   g.payment_received_at:=now();
  elsif action='cancel' and g.status in ('proposed','agreed') then g.status:='cancelled';
  else raise exception 'STATE_CONFLICT'; end if;
  update upahgo_private.agreements set status=g.status,payment_received_at=g.payment_received_at where id=g.id returning * into g;
  target_id:=case when actor=g.worker_id then g.employer_id else g.worker_id end;
  perform upahgo_private.notice(target_id,'Status pekerjaan diperbarui','Buka kesepakatan untuk melihat langkah berikutnya.','/agreement/'||g.id);
  return upahgo_private.agreement_json(g);
 when 'block','unblock','report' then
  perform upahgo_private.check_keys(p_args,case when p_operation='report' then array['targetId','category','detail'] else array['targetId'] end);
  target_id:=(p_args->>'targetId')::uuid;
  if target_id=actor or not exists(select 1 from upahgo_private.profiles where id=target_id) then raise exception 'UNAVAILABLE'; end if;
  if p_operation='unblock' then
   delete from upahgo_private.blocks b where b.owner_id=actor and b.target_id=(p_args->>'targetId')::uuid;
   return jsonb_build_object('ok',true);
  end if;
  if not exists(select 1 from upahgo_private.presences where user_id=target_id and expires_at>now()) and not exists(select 1 from upahgo_private.contacts where actor in(sender_id,receiver_id) and target_id in(sender_id,receiver_id)) then raise exception 'UNAVAILABLE'; end if;
  if p_operation='block' then
   perform pg_advisory_xact_lock(hashtextextended(least(actor,target_id)::text||greatest(actor,target_id)::text,1));
   insert into upahgo_private.blocks(owner_id,target_id) values(actor,target_id) on conflict do nothing;
   update upahgo_private.contacts set status='revoked',updated_at=now() where actor in(sender_id,receiver_id) and target_id in(sender_id,receiver_id) and status in ('pending','accepted');
   return jsonb_build_object('ok',true);
  end if;
  perform upahgo_private.limit_action(actor,'report_create',3);
  if length(trim(p_args->>'detail')) not between 10 and 1000 or (p_args->>'category') not in ('harassment','unsafe_work','unpaid','other') then raise exception 'REPORT_INVALID'; end if;
  insert into upahgo_private.reports(reporter_id,target_id,category,detail) values(actor,target_id,p_args->>'category',trim(p_args->>'detail')) returning id into obj;
  return jsonb_build_object('id',obj);
 when 'notifications' then
  perform upahgo_private.check_keys(p_args,'{}');
  return (select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'body',x.body,'route',x.route,'read',x.is_read,'createdAt',x.created_at) order by x.created_at desc),'[]') from
   (select * from upahgo_private.notifications where recipient_id=actor order by created_at desc limit 100) x);
 when 'read_notification' then
  perform upahgo_private.check_keys(p_args,array['id']);
  update upahgo_private.notifications set is_read=true where id=(p_args->>'id')::uuid and recipient_id=actor;
  if not found then raise exception 'UNAVAILABLE'; end if;
  return jsonb_build_object('ok',true);
 when 'request_deletion' then
  perform upahgo_private.check_keys(p_args,array['confirm']);
  if p_args->'confirm' is distinct from 'true'::jsonb then raise exception 'CONSENT_REQUIRED'; end if;
  insert into upahgo_private.deletion_requests(user_id) values(actor) on conflict do nothing;
  delete from upahgo_private.presences where user_id=actor;
  update upahgo_private.contacts set status='revoked',updated_at=now() where actor in(sender_id,receiver_id) and status in ('pending','accepted');
  update upahgo_private.profiles set status='deletion_requested',updated_at=now() where id=actor;
  return jsonb_build_object('ok',true);
 else raise exception 'INVALID_INPUT';
 end case;
end $$;

revoke all on all functions in schema upahgo_private from public,anon,authenticated;
revoke all on function public.upahgo_action(text,jsonb) from public,anon;
grant execute on function public.upahgo_action(text,jsonb) to authenticated;
comment on function public.upahgo_action(text,jsonb) is 'Authenticated gateway-only application API. Missing gateway provisioning fails closed. No service-role key in the client or Worker.';
commit;
