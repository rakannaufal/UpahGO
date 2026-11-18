begin;

-- Boundary data is provisioned by an operator from reviewed, licensed sources.
create table upahgo_private.cities (
 id text primary key check(length(id) between 2 and 80), label text not null,
 south double precision not null, north double precision not null,
 west double precision not null, east double precision not null,
 boundary jsonb not null check(boundary->>'type'='MultiPolygon' and jsonb_typeof(boundary->'coordinates')='array'),
 attribution text not null, enabled boolean not null default true,
 check(south>=-90 and north<=90 and south<north and west>=-180 and east<=180 and west<east)
);
alter table upahgo_private.areas add column city_id text references upahgo_private.cities(id);
create index areas_city on upahgo_private.areas(city_id) where enabled;
create table upahgo_private.account_locations (
 user_id uuid primary key references upahgo_private.accounts(id) on delete cascade,
 city_id text not null references upahgo_private.cities(id),
 latitude double precision not null check(latitude between -90 and 90),
 longitude double precision not null check(longitude between -180 and 180),
 accuracy_meters double precision not null check(accuracy_meters between 0 and 1000),
 captured_at timestamptz not null,
 radius_km integer not null check(radius_km in(1,3,5,10,20))
);
alter table upahgo_private.presences add column city_id text references upahgo_private.cities(id),
 add column latitude double precision, add column longitude double precision;
create index presence_city_role on upahgo_private.presences(city_id,role,expires_at);
create table upahgo_private.reviews (
 id uuid primary key default gen_random_uuid(),
 agreement_id uuid not null references upahgo_private.agreements(id),
 reviewer_id uuid not null references upahgo_private.profiles(id),
 target_id uuid not null references upahgo_private.profiles(id),
 target_role text not null check(target_role in('worker','employer')),
 score integer not null check(score between 1 and 5),
 comment text not null default '' check(length(comment)<=300),
 created_at timestamptz not null default now(),
 unique(agreement_id,reviewer_id), check(reviewer_id<>target_id)
);
create index reviews_target_role on upahgo_private.reviews(target_id,target_role,created_at desc);
alter table upahgo_private.cities enable row level security;
alter table upahgo_private.account_locations enable row level security;
alter table upahgo_private.reviews enable row level security;
revoke all on upahgo_private.cities,upahgo_private.account_locations,upahgo_private.reviews from public,anon,authenticated;

create function upahgo_private.in_boundary(b jsonb,lat double precision,lon double precision)
returns boolean language plpgsql immutable set search_path='' as $$
declare poly jsonb; ring jsonb; shape polygon; included boolean; i integer;
begin
 if lat is null or lon is null or lat not between -90 and 90 or lon not between -180 and 180 then return false; end if;
 for poly in select value from jsonb_array_elements(b->'coordinates') loop
  included:=false; i:=0;
  for ring in select value from jsonb_array_elements(poly) loop
   select ('('||string_agg(format('(%s,%s)',p->>0,p->>1),',')||')')::polygon into shape from jsonb_array_elements(ring) p;
   if i=0 then included:=shape @> point(lon,lat);
   elsif shape @> point(lon,lat) then included:=false; end if;
   i:=i+1;
  end loop;
  if included then return true; end if;
 end loop;
 return false;
end $$;
create function upahgo_private.distance_km(a double precision,b double precision,c double precision,d double precision)
returns double precision language sql immutable set search_path='' as $$
 select 6371*2*asin(sqrt(least(1::double precision,power(sin(radians(c-a)/2),2)+cos(radians(a))*cos(radians(c))*power(sin(radians(d-b)/2),2))));
$$;
create function upahgo_private.location_json(l upahgo_private.account_locations)
returns jsonb language sql stable set search_path='' as $$
 select case when l.user_id is null then null else jsonb_build_object('cityId',l.city_id,'latitude',l.latitude,'longitude',l.longitude,
 'accuracyMeters',l.accuracy_meters,'capturedAt',l.captured_at,'radiusKm',l.radius_km) end;
$$;
create or replace function upahgo_private.account_json(a upahgo_private.accounts) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',a.id,'role',a.role,'introSeen',a.intro_seen,'setupDone',a.setup_done,'browseAreaId',a.browse_area_id,
 'status',coalesce((select p.status from upahgo_private.profiles p where p.id=a.id and p.status<>'active'),a.status),
 'location',(select upahgo_private.location_json(l) from upahgo_private.account_locations l where l.user_id=a.id));
$$;
create function upahgo_private.review_json(r upahgo_private.reviews) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',r.id,'agreementId',r.agreement_id,'reviewerName',
 (select case when p.status='active' then p.name else 'Akun tidak aktif' end from upahgo_private.profiles p where p.id=r.reviewer_id),
 'score',r.score,'comment',r.comment,'createdAt',r.created_at);
$$;

alter function public.upahgo_action(text,jsonb) set schema upahgo_private;
alter function upahgo_private.upahgo_action(text,jsonb) rename to account_action;
revoke all on function upahgo_private.account_action(text,jsonb) from public,anon,authenticated;

create function public.upahgo_action(p_operation text,p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); a upahgo_private.accounts; p upahgo_private.profiles;
 l upahgo_private.account_locations; city upahgo_private.cities; ar upahgo_private.areas;
 g upahgo_private.agreements; r upahgo_private.reviews;
 expected bytea; secret text; result jsonb; requested_role text; area uuid; target uuid;
 lat double precision; lon double precision; accuracy double precision; captured timestamptz;
 radius integer; public_lat double precision; public_lon double precision; score integer; comment text; previous_city text;
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
 select * into l from upahgo_private.account_locations where user_id=actor;
 if p_operation<>'bootstrap' and (a.status<>'active' or (p.id is not null and p.status<>'active')) then raise exception 'ACCOUNT_RESTRICTED'; end if;
 if p_operation='bootstrap' then
  result:=upahgo_private.account_action(p_operation,p_args);
  select * into city from upahgo_private.cities where id=l.city_id and enabled;
  return result||jsonb_build_object('account',upahgo_private.account_json(a),'city',case when city.id is null then null else
    jsonb_build_object('id',city.id,'label',city.label,'boundary',city.boundary,'attribution',city.attribution,
     'bounds',jsonb_build_object('south',city.south,'north',city.north,'west',city.west,'east',city.east)) end,
   'areas',(select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'cityId',x.city_id,'label',x.label,'latitude',x.latitude,'longitude',x.longitude,'timezone',x.timezone) order by x.label),'[]') from upahgo_private.areas x where x.city_id=city.id and x.enabled));
 end if;
 if p_operation in('set_location','set_radius','set_area','discover','profile','reviews','agreement_reviews','submit_review') then
  perform upahgo_private.limit_action(actor,'all',90);
 end if;
 if p_operation='set_location' then
  perform upahgo_private.check_keys(p_args,array['latitude','longitude','accuracyMeters','capturedAt','radiusKm']);
  if jsonb_typeof(p_args->'latitude') is distinct from 'number' or jsonb_typeof(p_args->'longitude') is distinct from 'number'
   or jsonb_typeof(p_args->'accuracyMeters') is distinct from 'number' or jsonb_typeof(p_args->'radiusKm') is distinct from 'number' then raise exception 'LOCATION_REQUIRED'; end if;
  if (p_args->>'latitude')::numeric not between -90 and 90 or (p_args->>'longitude')::numeric not between -180 and 180 or (p_args->>'accuracyMeters')::numeric<0 then raise exception 'LOCATION_REQUIRED'; end if;
  if (p_args->>'accuracyMeters')::numeric>1000 then raise exception 'LOCATION_INACCURATE'; end if;
  lat:=(p_args->>'latitude')::double precision; lon:=(p_args->>'longitude')::double precision; accuracy:=(p_args->>'accuracyMeters')::double precision;
  begin captured:=(p_args->>'capturedAt')::timestamptz; exception when others then raise exception 'LOCATION_STALE'; end;
  if captured is null or captured<now()-interval '5 minutes' or captured>now()+interval '1 minute' then raise exception 'LOCATION_STALE'; end if;
  if (p_args->>'radiusKm')::numeric not in(1,3,5,10,20) then raise exception 'RADIUS_INVALID'; end if;
  radius:=(p_args->>'radiusKm')::integer;
  select * into city from upahgo_private.cities c where enabled and lat between south and north and lon between west and east
   and upahgo_private.in_boundary(c.boundary,lat,lon) order by (north-south)*(east-west),id limit 1;
  if city.id is null then raise exception 'CITY_UNAVAILABLE'; end if;
  previous_city:=l.city_id;
  -- Retain only a ~110 m search origin. Exact fixes never enter public payloads or tables.
  insert into upahgo_private.account_locations values(actor,city.id,round(lat::numeric,3),round(lon::numeric,3),accuracy,captured,radius)
   on conflict(user_id) do update set city_id=excluded.city_id,latitude=excluded.latitude,longitude=excluded.longitude,accuracy_meters=excluded.accuracy_meters,captured_at=excluded.captured_at,radius_km=excluded.radius_km returning * into l;
  select * into ar from upahgo_private.areas x where enabled and city_id=city.id and upahgo_private.in_boundary(city.boundary,x.latitude,x.longitude)
   order by upahgo_private.distance_km(lat,lon,x.latitude,x.longitude),id limit 1;
  if previous_city is distinct from city.id then
   delete from upahgo_private.presences where user_id=actor;
   update upahgo_private.accounts set browse_area_id=null where id=actor returning * into a;
   update upahgo_private.profiles set area_id=ar.id,region=city.label where id=actor;
  end if;
  public_lat:=round(lat::numeric,2); public_lon:=round(lon::numeric,2);
  if not upahgo_private.in_boundary(city.boundary,public_lat,public_lon) then public_lat:=ar.latitude; public_lon:=ar.longitude; end if;
  update upahgo_private.presences set city_id=city.id,latitude=public_lat,longitude=public_lon where user_id=actor;
  return upahgo_private.account_json(a);
 end if;
 if p_operation in('set_radius','set_area','discover','profile','reviews','request_contact') or (p_operation='visibility' and p_args->'enabled'='true'::jsonb) then
  if (p_operation='request_contact' or p_operation='visibility') and (p.id is null or p.area_id is null or cardinality(p.tags)=0) then raise exception 'PROFILE_INCOMPLETE'; end if;
  if l.user_id is null then raise exception 'LOCATION_REQUIRED'; end if;
  if l.captured_at<now()-interval '30 minutes' then raise exception 'LOCATION_STALE'; end if;
  select * into city from upahgo_private.cities where id=l.city_id and enabled;
  if city.id is null then raise exception 'CITY_UNAVAILABLE'; end if;
 end if;
 if p_operation='set_radius' then
  perform upahgo_private.check_keys(p_args,array['radiusKm']);
  if jsonb_typeof(p_args->'radiusKm') is distinct from 'number' then raise exception 'RADIUS_INVALID'; end if;
  if (p_args->>'radiusKm')::numeric not in(1,3,5,10,20) then raise exception 'RADIUS_INVALID'; end if;
  radius:=(p_args->>'radiusKm')::integer;
  update upahgo_private.account_locations set radius_km=radius where user_id=actor;
  return upahgo_private.account_json(a);
 end if;
 if p_operation='set_area' then
  perform upahgo_private.check_keys(p_args,array['areaId']);
  area:=nullif(p_args->>'areaId','')::uuid;
  if area is not null and not exists(select 1 from upahgo_private.areas where id=area and city_id=l.city_id and enabled) then raise exception 'CITY_MISMATCH'; end if;
  update upahgo_private.accounts set browse_area_id=area where id=actor returning * into a;
  return upahgo_private.account_json(a);
 end if;
 if p_operation in('discover','profile','reviews') then
  if a.role is null then raise exception 'ROLE_REQUIRED'; end if;
  perform upahgo_private.check_keys(p_args,case when p_operation in('profile','reviews') then array['id','role'] else array['areaId','role','tag'] end);
  requested_role:=p_args->>'role';
  if requested_role is null or requested_role not in('worker','employer') then raise exception 'INVALID_INPUT'; end if;
  area:=nullif(p_args->>'areaId','')::uuid;
  if area is not null and not exists(select 1 from upahgo_private.areas where id=area and city_id=l.city_id and enabled) then raise exception 'CITY_MISMATCH'; end if;
  if nullif(p_args->>'tag','') is not null and not exists(select 1 from upahgo_private.tags where id=p_args->>'tag' and enabled) then raise exception 'TAGS_INVALID'; end if;
  select coalesce(jsonb_agg(item order by distance,id),'[]') into result from (
   select x.id,upahgo_private.distance_km(l.latitude,l.longitude,v.latitude,v.longitude) distance,
    jsonb_build_object('id',x.id,'name',x.name,'role',v.role,'areaId',directory_area.id,'areaLabel',directory_area.label,'latitude',v.latitude,'longitude',v.longitude,
     'tags',v.tags,'bio',x.bio,'expiresAt',least(v.expires_at,loc.captured_at+interval '30 minutes'),
     'distanceKm',round(upahgo_private.distance_km(l.latitude,l.longitude,v.latitude,v.longitude)::numeric,1),
     'ratingAverage',(select round(avg(rating_rows.score),1) from upahgo_private.reviews rating_rows where target_id=x.id and target_role=v.role),
     'ratingCount',(select count(*) from upahgo_private.reviews where target_id=x.id and target_role=v.role)) item
   from upahgo_private.presences v join upahgo_private.profiles x on x.id=v.user_id join upahgo_private.areas directory_area on directory_area.id=v.area_id
    join upahgo_private.account_locations loc on loc.user_id=x.id
   where x.id<>actor and x.status='active' and v.expires_at>now() and loc.captured_at>now()-interval '30 minutes'
    and directory_area.enabled and directory_area.city_id=l.city_id and v.city_id=l.city_id and v.role=requested_role
    and v.latitude is not null and v.longitude is not null and not upahgo_private.blocked(actor,x.id)
    and upahgo_private.distance_km(l.latitude,l.longitude,v.latitude,v.longitude)<=l.radius_km
    and ((p_operation in('profile','reviews') and x.id=(p_args->>'id')::uuid) or
     (p_operation='discover' and (area is null or directory_area.id=area) and (nullif(p_args->>'tag','') is null or p_args->>'tag'=any(v.tags))))
   order by distance,x.id limit 40
  ) q;
  if p_operation in('profile','reviews') then
   if jsonb_array_length(result)=0 then raise exception 'UNAVAILABLE'; end if;
   if p_operation='profile' then return result->0; end if;
   return (select coalesce(jsonb_agg(upahgo_private.review_json(review_row) order by review_row.created_at desc,review_row.id),'[]') from
    (select * from upahgo_private.reviews where target_id=(p_args->>'id')::uuid and target_role=requested_role order by created_at desc,id limit 30) review_row);
  end if;
  return result;
 end if;
 if p_operation in('agreement_reviews','submit_review') then
  perform upahgo_private.check_keys(p_args,case when p_operation='submit_review' then array['id','score','comment'] else array['id'] end);
  select * into g from upahgo_private.agreements where id=(p_args->>'id')::uuid and actor in(worker_id,employer_id) for update;
  if g.id is null then raise exception 'UNAVAILABLE'; end if;
  if p_operation='agreement_reviews' then
   return jsonb_build_object('submitted',(select upahgo_private.review_json(review_row) from upahgo_private.reviews review_row where agreement_id=g.id and reviewer_id=actor),
    'received',(select upahgo_private.review_json(review_row) from upahgo_private.reviews review_row where agreement_id=g.id and target_id=actor));
  end if;
  if g.status<>'completed' then raise exception 'REVIEW_NOT_ALLOWED'; end if;
  if jsonb_typeof(p_args->'score') is distinct from 'number' or (p_args ? 'comment' and jsonb_typeof(p_args->'comment') is distinct from 'string') then raise exception 'REVIEW_INVALID'; end if;
  if (p_args->>'score')::numeric not in(1,2,3,4,5) then raise exception 'REVIEW_INVALID'; end if;
  score:=(p_args->>'score')::integer; comment:=trim(coalesce(p_args->>'comment',''));
  if length(comment)>300 or comment ~* '(https?:|www\.|\+?[0-9][0-9 ()-]{7,})' then raise exception 'REVIEW_INVALID'; end if;
  if exists(select 1 from upahgo_private.reviews where agreement_id=g.id and reviewer_id=actor) then raise exception 'REVIEW_EXISTS'; end if;
  perform upahgo_private.limit_action(actor,'review_create',10);
  target:=case when actor=g.worker_id then g.employer_id else g.worker_id end;
  insert into upahgo_private.reviews(agreement_id,reviewer_id,target_id,target_role,score,comment)
   values(g.id,actor,target,case when actor=g.worker_id then 'employer' else 'worker' end,score,comment) returning * into r;
  perform upahgo_private.notice(target,'Penilaian baru diterima','Lihat penilaian pekerjaanmu.','/agreement/'||g.id);
  return upahgo_private.review_json(r);
 end if;
 if p_operation='save_profile' and nullif(p_args->>'areaId','') is not null then
  if l.user_id is null then raise exception 'LOCATION_REQUIRED'; end if;
  if not exists(select 1 from upahgo_private.areas where id=(p_args->>'areaId')::uuid and city_id=l.city_id and enabled) then raise exception 'CITY_MISMATCH'; end if;
 end if;
 if p_operation='request_contact' then
  -- Exact target identity is authorized against the same city/radius query as discovery.
  perform public.upahgo_action('profile',jsonb_build_object('id',p_args->>'targetId','role',p_args->>'targetRole'));
 end if;
 if p_operation='visibility' and p_args->'enabled'='true'::jsonb then
  if not exists(select 1 from upahgo_private.areas where id=p.area_id and city_id=l.city_id and enabled) then raise exception 'CITY_MISMATCH'; end if;
  public_lat:=round(l.latitude::numeric,2); public_lon:=round(l.longitude::numeric,2);
  if not upahgo_private.in_boundary(city.boundary,public_lat,public_lon) then
   select * into ar from upahgo_private.areas where id=p.area_id and upahgo_private.in_boundary(city.boundary,latitude,longitude);
   public_lat:=ar.latitude; public_lon:=ar.longitude;
  end if;
  if public_lat is null then raise exception 'CITY_UNAVAILABLE'; end if;
  result:=upahgo_private.account_action(p_operation,p_args);
  update upahgo_private.presences set city_id=l.city_id,latitude=public_lat,longitude=public_lon where user_id=actor;
  return result;
 end if;
 if p_operation='request_deletion' then
  result:=upahgo_private.account_action(p_operation,p_args);
  delete from upahgo_private.account_locations where user_id=actor;
  return result;
 end if;
 return upahgo_private.account_action(p_operation,p_args);
end $$;
revoke all on function public.upahgo_action(text,jsonb) from public,anon;
grant execute on function public.upahgo_action(text,jsonb) to authenticated;
revoke all on all functions in schema upahgo_private from public,anon,authenticated;
comment on table upahgo_private.account_locations is 'Private rounded search origin, 30-minute freshness. Device GPS is untrusted, not proof against spoofing. No background tracking.';
comment on table upahgo_private.reviews is 'Immutable, one review per completed agreement participant; target and historical role derived server-side.';
commit;
