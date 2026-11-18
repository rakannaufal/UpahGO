begin;

create table upahgo_private.deletion_policy (
 singleton boolean primary key default true check(singleton),
 version text not null default 'draft-2026-11', enabled boolean not null default false,
 approved_by text, approved_at timestamptz,
 work_days integer not null default 365 check(work_days between 1 and 3650),
 report_days integer not null default 180 check(report_days between 1 and 3650),
 backup_days integer not null default 30 check(backup_days between 1 and 60),
 check(not enabled or (approved_by is not null and approved_at is not null))
);
insert into upahgo_private.deletion_policy(singleton) values(true);
alter table upahgo_private.deletion_requests drop constraint deletion_requests_user_id_fkey;
alter table upahgo_private.deletion_requests
 add column lease uuid, add column lease_until timestamptz,
 add column next_attempt_at timestamptz not null default now(),
 add column attempts integer not null default 0,
 add column last_error text check(last_error in('STORAGE_FAILED','AUTH_FAILED','DATABASE_FAILED','INVALID_STORAGE_KEY')),
 add column erased_profile_id uuid, add column policy_version text,
 add column completed_at timestamptz, add column ledger_exported_at timestamptz,
 add constraint deletion_stage check(status in('requested','storage','auth','verify','awaiting_ledger','completed','failed'));
create index deletion_queue_due on upahgo_private.deletion_requests(next_attempt_at) where status not in('completed','awaiting_ledger','failed');
create table upahgo_private.deletion_retention (
 kind text not null check(kind in('work','report','review')), record_id uuid not null,
 expires_at timestamptz not null, hold_until timestamptz,
 hold_case text check(hold_case ~ '^[A-Za-z0-9_-]{6,80}$'),
 primary key(kind,record_id), check(hold_until is null or hold_case is not null)
);
create index deletion_retention_due on upahgo_private.deletion_retention(expires_at);
alter table upahgo_private.deletion_policy enable row level security;
alter table upahgo_private.deletion_retention enable row level security;
revoke all on upahgo_private.deletion_policy,upahgo_private.deletion_retention from public,anon,authenticated;

-- Live profiles keep their Auth FK; erased surrogate profiles cannot be used to sign in.
alter table upahgo_private.profiles add column auth_user_id uuid references auth.users(id) on delete cascade;
update upahgo_private.profiles set auth_user_id=id;
alter table upahgo_private.profiles drop constraint profiles_id_fkey;
alter table upahgo_private.profiles add constraint profile_identity check(
 (auth_user_id is not null and auth_user_id=id) or (auth_user_id is null and status='deletion_requested' and name='Akun dihapus' and bio='' and area_id is null and tags='{}'));
create function upahgo_private.profile_identity_default() returns trigger language plpgsql set search_path='' as $$
begin
 if new.auth_user_id is null and new.status<>'deletion_requested' then new.auth_user_id:=new.id; end if;
 return new;
end $$;
create trigger profile_identity_default before insert on upahgo_private.profiles for each row execute function upahgo_private.profile_identity_default();
create or replace function upahgo_private.notice(u uuid,t text,b text,r text) returns void language sql set search_path='' as $$
 insert into upahgo_private.notifications(recipient_id,title,body,route)
 select u,t,b,r where exists(select 1 from upahgo_private.profiles where id=u and auth_user_id is not null and status='active');
$$;

alter function public.upahgo_action(text,jsonb) set schema upahgo_private;
alter function upahgo_private.upahgo_action(text,jsonb) rename to history_action;
create function public.upahgo_action(p_operation text,p_args jsonb default '{}'::jsonb) returns jsonb
 language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); secret text; expected bytea; result jsonb;
begin
 if p_operation is distinct from 'request_deletion' then
  result:=upahgo_private.history_action(p_operation,p_args);
  if p_operation='bootstrap' then return result||jsonb_build_object('deletionPolicy',(select jsonb_build_object('enabled',enabled,'version',version,'workDays',work_days,'reportDays',report_days,'backupDays',backup_days) from upahgo_private.deletion_policy)); end if;
  return result;
 end if;
 if actor is null then raise exception 'UNAUTHENTICATED'; end if;
 select secret_hash into expected from upahgo_private.gateway_config where singleton;
 secret:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-upahgo-gateway','');
 if expected is null or length(secret)<32 or extensions.digest(secret,'sha256')<>expected then raise exception 'GATEWAY_NOT_CONFIGURED'; end if;
 if jsonb_typeof(p_args) is distinct from 'object' or octet_length(p_args::text)>16384 then raise exception 'INVALID_INPUT'; end if;
 perform upahgo_private.check_keys(p_args,array['confirm']);
 if p_args->'confirm' is distinct from 'true'::jsonb then raise exception 'CONSENT_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if exists(select 1 from upahgo_private.deletion_requests where user_id=actor) then
  perform upahgo_private.limit_action(actor,'all',90);
  return jsonb_build_object('ok',true);
 end if;
 result:=upahgo_private.history_action(p_operation,p_args);
 update upahgo_private.deletion_requests set policy_version=(select version from upahgo_private.deletion_policy) where user_id=actor;
 return result;
end $$;

create function public.upahgo_deletion_admin(p_action text,p_args jsonb default '{}'::jsonb) returns jsonb
 language plpgsql security definer set search_path='' as $$
declare policy upahgo_private.deletion_policy; job upahgo_private.deletion_requests;
 subject uuid; token uuid; surrogate uuid; p upahgo_private.profiles; item record; ids uuid[]; n integer:=0;
begin
 if jsonb_typeof(p_args) is distinct from 'object' or octet_length(p_args::text)>16384 then raise exception 'INVALID_INPUT'; end if;
 select * into policy from upahgo_private.deletion_policy where singleton;
 if p_action='ledger' then
  perform upahgo_private.check_keys(p_args,array['afterUserId']);
  subject:=nullif(p_args->>'afterUserId','')::uuid;
  return (select coalesce(jsonb_agg(jsonb_build_object('userId',user_id,'requestedAt',created_at,'policyVersion',policy_version)),'[]') from
   (select * from upahgo_private.deletion_requests where (subject is null or user_id>subject) order by user_id limit 1000) q);
 end if;
 if not policy.enabled then raise exception 'POLICY_NOT_APPROVED'; end if;
 if p_action='claim' then
  perform upahgo_private.check_keys(p_args,array[]::text[]);
  select * into job from upahgo_private.deletion_requests
   where status in('requested','storage','auth','verify') and next_attempt_at<=now() and (lease_until is null or lease_until<now())
   order by next_attempt_at,user_id for update skip locked limit 1;
  if job.user_id is null then return 'null'::jsonb; end if;
  update upahgo_private.deletion_requests set lease=extensions.gen_random_uuid(),lease_until=now()+interval '10 minutes',attempts=attempts+1,
   policy_version=coalesce(policy_version,policy.version) where user_id=job.user_id returning * into job;
  return jsonb_build_object('userId',job.user_id,'lease',job.lease,'stage',job.status);
 end if;
 if p_action in('ack_ledger','replay') then
  perform upahgo_private.check_keys(p_args,array['userIds']);
  if jsonb_typeof(p_args->'userIds') is distinct from 'array' or jsonb_array_length(p_args->'userIds') not between 1 and 100 then raise exception 'INVALID_INPUT'; end if;
  select array_agg(value::uuid) into ids from jsonb_array_elements_text(p_args->'userIds');
  if p_action='ack_ledger' then
   update upahgo_private.deletion_requests set ledger_exported_at=now(),status='completed',completed_at=coalesce(completed_at,now())
    where user_id=any(ids) and status in('awaiting_ledger','completed');
  else
   foreach subject in array ids loop
    perform pg_advisory_xact_lock(hashtextextended(subject::text,0));
    if exists(select 1 from auth.users where id=subject) then
     update upahgo_private.accounts set status='deletion_requested' where id=subject;
     update upahgo_private.profiles set status='deletion_requested' where id=subject;
     delete from upahgo_private.presences where user_id=subject;
     delete from upahgo_private.account_locations where user_id=subject;
     update upahgo_private.contacts set status='revoked' where subject in(sender_id,receiver_id) and status in('pending','accepted');
    end if;
    -- Storage may be restored independently even when Auth remains absent.
    insert into upahgo_private.deletion_requests(user_id,policy_version) values(subject,policy.version)
     on conflict(user_id) do update set status='requested',lease=null,lease_until=null,next_attempt_at=now(),attempts=0,completed_at=null,ledger_exported_at=null;
   end loop;
  end if;
  return jsonb_build_object('ok',true);
 end if;
 if p_action='maintain' then
  perform upahgo_private.check_keys(p_args,array[]::text[]);
  for item in select * from upahgo_private.deletion_retention where expires_at<=now() and (hold_until is null or hold_until<=now())
   order by expires_at,kind,record_id for update skip locked limit 100 loop
   if item.kind='work' then
    update upahgo_private.agreements set title='Catatan kerja',tasks='Rincian dihapus sesuai masa retensi.' where id=item.record_id;
    delete from upahgo_private.agreement_details where agreement_id=item.record_id;
   elsif item.kind='report' then delete from upahgo_private.reports where id=item.record_id;
   else update upahgo_private.reviews set comment='' where id=item.record_id;
   end if;
   delete from upahgo_private.deletion_retention where kind=item.kind and record_id=item.record_id;
   n:=n+1;
  end loop;
  -- Keep the active counterpart's minimum financial history; remove unowned expired history.
  select array_agg(id) into ids from (
   select g.id from upahgo_private.agreements g join upahgo_private.profiles w on w.id=g.worker_id join upahgo_private.profiles e on e.id=g.employer_id
   where w.auth_user_id is null and e.auth_user_id is null
    and not exists(select 1 from upahgo_private.deletion_retention where kind='work' and record_id=g.id)
    and not exists(select 1 from upahgo_private.reviews r join upahgo_private.deletion_retention d on d.kind='review' and d.record_id=r.id where r.agreement_id=g.id)
   order by g.id limit 100) q;
  delete from upahgo_private.reviews where agreement_id=any(ids);
  delete from upahgo_private.agreement_details where agreement_id=any(ids);
  delete from upahgo_private.agreements where id=any(ids);
  delete from upahgo_private.contacts where id in(
   select c.id from upahgo_private.contacts c join upahgo_private.profiles s on s.id=c.sender_id join upahgo_private.profiles r on r.id=c.receiver_id
   where s.auth_user_id is null and r.auth_user_id is null and not exists(select 1 from upahgo_private.agreements where contact_id=c.id) order by c.id limit 100);
  delete from upahgo_private.profiles where id in(
   select erased.id from upahgo_private.profiles erased where erased.auth_user_id is null
    and not exists(select 1 from upahgo_private.contacts where erased.id in(sender_id,receiver_id))
    and not exists(select 1 from upahgo_private.agreements where erased.id in(worker_id,employer_id,creator_id))
    and not exists(select 1 from upahgo_private.reviews where erased.id in(reviewer_id,target_id))
    and not exists(select 1 from upahgo_private.reports where erased.id in(reporter_id,target_id)) order by erased.id limit 100);
  delete from upahgo_private.deletion_requests where status='completed' and completed_at<now()-interval '90 days' and ledger_exported_at is not null;
  return jsonb_build_object('purged',n);
 end if;
 perform upahgo_private.check_keys(p_args,case when p_action='fail' then array['userId','lease','error'] else array['userId','lease'] end);
 subject:=(p_args->>'userId')::uuid; token:=(p_args->>'lease')::uuid;
 if subject is null or token is null then raise exception 'INVALID_INPUT'; end if;
 perform pg_advisory_xact_lock(hashtextextended(subject::text,0));
 select * into job from upahgo_private.deletion_requests where user_id=subject for update;
 if job.user_id is null or job.lease is distinct from token or job.lease_until<=now() then raise exception 'LEASE_EXPIRED'; end if;
 if (p_action='prepare' and job.status in('storage','auth')) or (p_action='storage_done' and job.status='auth') then return jsonb_build_object('ok',true); end if;
 if p_action='prepare' and job.status='requested' then
  select * into p from upahgo_private.profiles where id=subject;
  if exists(select 1 from upahgo_private.accounts where id=subject and status<>'deletion_requested') then raise exception 'STATE_CONFLICT'; end if;
  surrogate:=extensions.gen_random_uuid();
  if p.id is not null then
   insert into upahgo_private.profiles(id,name,region,role,status) values(surrogate,'Akun dihapus','Dihapus',p.role,'deletion_requested');
   insert into upahgo_private.deletion_retention(kind,record_id,expires_at)
    select 'work',id,now()+policy.work_days*interval '1 day' from upahgo_private.agreements where subject in(worker_id,employer_id)
    on conflict(kind,record_id) do update set expires_at=least(upahgo_private.deletion_retention.expires_at,excluded.expires_at);
   insert into upahgo_private.deletion_retention(kind,record_id,expires_at)
    select 'report',id,now()+policy.report_days*interval '1 day' from upahgo_private.reports where subject in(reporter_id,target_id)
    on conflict(kind,record_id) do update set expires_at=least(upahgo_private.deletion_retention.expires_at,excluded.expires_at);
   insert into upahgo_private.deletion_retention(kind,record_id,expires_at)
    select 'review',id,now()+policy.work_days*interval '1 day' from upahgo_private.reviews where subject in(reviewer_id,target_id)
    on conflict(kind,record_id) do update set expires_at=least(upahgo_private.deletion_retention.expires_at,excluded.expires_at);
   update upahgo_private.contacts set sender_id=case when sender_id=subject then surrogate else sender_id end,
    receiver_id=case when receiver_id=subject then surrogate else receiver_id end,status=case when status in('pending','accepted') then 'revoked' else status end,
    sender_phone_hash=decode('','hex'),receiver_phone_hash=null where subject in(sender_id,receiver_id);
   update upahgo_private.agreements set worker_id=case when worker_id=subject then surrogate else worker_id end,
    employer_id=case when employer_id=subject then surrogate else employer_id end,creator_id=case when creator_id=subject then surrogate else creator_id end
    where subject in(worker_id,employer_id);
   update upahgo_private.reports set reporter_id=case when reporter_id=subject then surrogate else reporter_id end,target_id=case when target_id=subject then surrogate else target_id end where subject in(reporter_id,target_id);
   update upahgo_private.reviews set reviewer_id=case when reviewer_id=subject then surrogate else reviewer_id end,target_id=case when target_id=subject then surrogate else target_id end where subject in(reviewer_id,target_id);
   delete from upahgo_private.blocks where subject in(owner_id,target_id);
   delete from upahgo_private.notifications where recipient_id=subject;
   delete from upahgo_private.profiles where id=subject;
  end if;
  insert into upahgo_private.media_cleanup select object_key,now() from upahgo_private.profile_photos where user_id=subject on conflict do nothing;
  delete from upahgo_private.profile_photos where user_id=subject;
  delete from upahgo_private.profile_prices where user_id=subject;
  delete from upahgo_private.role_profiles where user_id=subject;
  delete from upahgo_private.job_suggestions where user_id=subject;
  delete from upahgo_private.account_locations where user_id=subject;
  update upahgo_private.accounts set role=null,browse_area_id=null,intro_seen=false,setup_done=false where id=subject;
  update upahgo_private.deletion_requests set status='storage',policy_version=policy.version,erased_profile_id=case when p.id is null then null else surrogate end where user_id=subject;
 elsif p_action='storage_done' and job.status='storage' then
  update upahgo_private.deletion_requests set status='auth' where user_id=subject;
 elsif p_action='auth_done' and job.status='auth' then
  if exists(select 1 from auth.users where id=subject) then raise exception 'AUTH_STILL_EXISTS'; end if;
  update upahgo_private.deletion_requests set status='verify',next_attempt_at=now()+interval '1 hour',lease=null,lease_until=null where user_id=subject;
 elsif p_action='verify_done' and job.status='verify' then
  if exists(select 1 from auth.users where id=subject) then raise exception 'AUTH_STILL_EXISTS'; end if;
  delete from upahgo_private.media_cleanup where object_key like subject::text||'/%';
  update upahgo_private.deletion_requests set status='awaiting_ledger',lease=null,lease_until=null,last_error=null where user_id=subject;
 elsif p_action='defer' then
  update upahgo_private.deletion_requests set attempts=greatest(attempts-1,0),next_attempt_at=now()+interval '1 minute',lease=null,lease_until=null where user_id=subject;
 elsif p_action='fail' then
  if p_args->>'error' not in('STORAGE_FAILED','AUTH_FAILED','DATABASE_FAILED','INVALID_STORAGE_KEY') or p_args->>'error' is null then raise exception 'INVALID_INPUT'; end if;
  update upahgo_private.deletion_requests set status=case when attempts>=12 then 'failed' else status end,last_error=p_args->>'error',
   next_attempt_at=now()+least(86400,30*power(2,least(attempts,12))) * interval '1 second',lease=null,lease_until=null where user_id=subject;
 else raise exception 'STATE_CONFLICT'; end if;
 return jsonb_build_object('ok',true);
end $$;

create function upahgo_private.guard_auth_erasure() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (exists(select 1 from upahgo_private.profiles where id=old.id) or exists(select 1 from upahgo_private.accounts where id=old.id))
  and not exists(select 1 from upahgo_private.deletion_requests where user_id=old.id and status='auth' and lease_until>now()) then raise exception 'DELETION_NOT_PREPARED'; end if;
 return old;
end $$;
create trigger upahgo_guard_auth_erasure before delete on auth.users for each row execute function upahgo_private.guard_auth_erasure();

-- New evidence about an erased participant must not bypass the retention queue.
create function upahgo_private.erased_evidence_retention() returns trigger language plpgsql security definer set search_path='' as $$
declare days integer;
begin
 if tg_table_name='reviews' then
  if not exists(select 1 from upahgo_private.profiles where id in(new.reviewer_id,new.target_id) and auth_user_id is null) then return new; end if;
  select work_days into days from upahgo_private.deletion_policy;
  insert into upahgo_private.deletion_retention(kind,record_id,expires_at) values('review',new.id,now()+days*interval '1 day')
   on conflict(kind,record_id) do nothing;
 else
  if not exists(select 1 from upahgo_private.profiles where id in(new.reporter_id,new.target_id) and auth_user_id is null) then return new; end if;
  select report_days into days from upahgo_private.deletion_policy;
  insert into upahgo_private.deletion_retention(kind,record_id,expires_at) values('report',new.id,now()+days*interval '1 day')
   on conflict(kind,record_id) do nothing;
 end if;
 return new;
end $$;
create trigger erased_review_retention after insert on upahgo_private.reviews for each row execute function upahgo_private.erased_evidence_retention();
create trigger erased_report_retention after insert on upahgo_private.reports for each row execute function upahgo_private.erased_evidence_retention();

revoke all on function public.upahgo_action(text,jsonb) from public,anon;
grant execute on function public.upahgo_action(text,jsonb) to authenticated;
revoke all on function public.upahgo_deletion_admin(text,jsonb) from public,anon,authenticated;
do $$ begin if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function public.upahgo_deletion_admin(text,jsonb) to service_role; end if; end $$;
revoke all on all functions in schema upahgo_private from public,anon,authenticated;
commit;
