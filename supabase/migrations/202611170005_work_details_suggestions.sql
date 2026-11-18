begin;
create table upahgo_private.agreement_details (
 agreement_id uuid primary key references upahgo_private.agreements on delete cascade,
 work_context jsonb not null
);
create table upahgo_private.job_suggestions (
 id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 title text not null check(length(title) between 3 and 80), detail text not null check(length(detail) between 10 and 1000),
 work_context jsonb, status text not null default 'pending' check(status='pending'), created_at timestamptz not null default now()
);
create index job_suggestions_owner on upahgo_private.job_suggestions(user_id,created_at desc);
alter table upahgo_private.agreement_details enable row level security;
alter table upahgo_private.job_suggestions enable row level security;
alter function public.upahgo_action(text,jsonb) set schema upahgo_private;
alter function upahgo_private.upahgo_action(text,jsonb) rename to design_action;
create function public.upahgo_action(p_operation text,p_args jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); expected bytea; secret text; result jsonb; context jsonb; suggestion upahgo_private.job_suggestions; title text; detail text;
begin
 if p_operation not in('create_agreement','agreements','suggest_job','job_suggestions') then return upahgo_private.design_action(p_operation,p_args); end if;
 if actor is null then raise exception 'UNAUTHENTICATED'; end if;
 select secret_hash into expected from upahgo_private.gateway_config where singleton;
 secret:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-upahgo-gateway','');
 if expected is null or length(secret)<32 or extensions.digest(secret,'sha256')<>expected then raise exception 'GATEWAY_NOT_CONFIGURED'; end if;
 if jsonb_typeof(p_args) is distinct from 'object' or octet_length(p_args::text)>16384 then raise exception 'INVALID_INPUT'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if not exists(select 1 from upahgo_private.accounts where id=actor and status='active') then raise exception 'ACCOUNT_RESTRICTED'; end if;
 if p_operation='agreements' then
  result:=upahgo_private.design_action(p_operation,p_args);
  return (select coalesce(jsonb_agg(item||jsonb_build_object('workContext',(select work_context from upahgo_private.agreement_details where agreement_id=(item->>'id')::uuid)) order by ordinal),'[]') from jsonb_array_elements(result) with ordinality as e(item,ordinal));
 end if;
 context:=nullif(p_args->'workContext','null'::jsonb);
 perform upahgo_private.validate_work_context(context);
 if p_operation='create_agreement' then
  result:=upahgo_private.design_action(p_operation,p_args-'workContext');
  if context is not null then insert into upahgo_private.agreement_details values((result->>'id')::uuid,context); end if;
  return result||jsonb_build_object('workContext',context);
 end if;
 perform upahgo_private.limit_action(actor,'all',90);
 if p_operation='job_suggestions' then
  perform upahgo_private.check_keys(p_args,array[]::text[]);
  return (select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'detail',s.detail,'status',s.status,'createdAt',s.created_at) order by s.created_at desc,s.id),'[]') from (select * from upahgo_private.job_suggestions where user_id=actor order by created_at desc,id limit 30) s);
 end if;
 perform upahgo_private.check_keys(p_args,array['title','detail','workContext']);
 if jsonb_typeof(p_args->'title') is distinct from 'string' or jsonb_typeof(p_args->'detail') is distinct from 'string' then raise exception 'SUGGESTION_INVALID'; end if;
 title:=trim(p_args->>'title'); detail:=trim(p_args->>'detail');
 if length(title) not between 3 and 80 or length(detail) not between 10 and 1000 or title||' '||detail ~* '(https?:|www\.|\+?[0-9][0-9 ()-]{7,})' then raise exception 'SUGGESTION_INVALID'; end if;
 perform upahgo_private.limit_action(actor,'job_suggestion',5);
 insert into upahgo_private.job_suggestions(user_id,title,detail,work_context) values(actor,title,detail,context) returning * into suggestion;
 return jsonb_build_object('id',suggestion.id,'title',suggestion.title,'detail',suggestion.detail,'status',suggestion.status,'createdAt',suggestion.created_at);
end $$;
revoke all on function public.upahgo_action(text,jsonb) from public,anon;
grant execute on function public.upahgo_action(text,jsonb) to authenticated;
revoke all on all functions in schema upahgo_private from public,anon,authenticated;
comment on table upahgo_private.job_suggestions is 'Private pending proposals only. No automatic publication, category activation or promised operator response.';
commit;
