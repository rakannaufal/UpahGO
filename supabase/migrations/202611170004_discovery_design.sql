begin;
create table upahgo_private.job_catalog (
 id text primary key, label text not null, category_id text not null,
 aliases text not null, baseline jsonb not null, enabled boolean not null default false
);
insert into upahgo_private.job_catalog values
('sweep','Menyapu ruangan','family-1','','["light", "medium"]',true),
('mop','Mengepel lantai','family-1','','["medium"]',true),
('dust','Lap debu meja dan rak terjangkau','family-1','','["light"]',true),
('kitchen','Membersihkan dapur','family-1','','["medium"]',true),
('bathroom','Membersihkan kamar mandi','family-1','','["medium"]',true),
('windows','Membersihkan jendela terjangkau','family-1','','["light", "medium"]',true),
('job-007','Membersihkan teras atau balkon aman','family-1','','["medium"]',false),
('job-008','Merapikan kamar atau kos','family-1','','["light", "medium"]',false),
('dishwash','Mencuci piring','family-2','piring cuci','["light", "medium"]',false),
('laundry','Melipat pakaian','family-2','','["light"]',false),
('job-011','Menyetrika pakaian','family-2','','["light", "medium"]',false),
('job-012','Menjemur pakaian','family-2','','["light", "medium"]',false),
('job-013','Mengangkat dan merapikan jemuran','family-2','','["light", "medium"]',false),
('job-014','Memilah cucian','family-2','','["light"]',false),
('job-015','Mengganti seprai dan sarung bantal','family-2','','["light", "medium"]',false),
('job-016','Mengemas pesanan laundry','family-2','','["light", "medium"]',false),
('job-017','Menyapu halaman','family-3','','["light", "medium"]',false),
('job-018','Mengumpulkan daun','family-3','','["light", "medium"]',false),
('job-019','Menyiram tanaman','family-3','','["light", "medium"]',false),
('job-020','Mencabut rumput manual','family-3','','["medium"]',false),
('job-021','Memangkas tanaman rendah manual','family-3','','["medium"]',false),
('job-022','Menanam bibit dalam pot','family-3','','["light", "medium"]',false),
('job-023','Mengganti media pot','family-3','','["medium", "heavy"]',false),
('job-024','Mengangkut daun dan tanah kebun','family-3','','["medium", "heavy"]',false),
('water-carry','Mengangkat galon penuh','family-4','galon air angkat','["heavy"]',false),
('box-move','Memindahkan kardus','family-4','','["medium", "heavy"]',false),
('job-027','Memindahkan meja','family-4','','["medium", "heavy"]',false),
('job-028','Menata atau memindahkan kursi','family-4','','["medium", "heavy"]',false),
('job-029','Memindahkan sofa','family-4','','["heavy"]',false),
('job-030','Memindahkan lemari kosong','family-4','','["heavy"]',false),
('job-031','Mengemas barang pindahan','family-4','','["light", "medium"]',false),
('job-032','Membantu bongkar muat barang rumah','family-4','','["heavy"]',false),
('job-033','Menata barang di rak rendah','family-5','','["light", "medium"]',false),
('job-034','Memilah barang dagangan','family-5','','["light"]',false),
('job-035','Memberi label harga','family-5','','["light"]',false),
('job-036','Menghitung stok manual','family-5','','["light", "medium"]',false),
('job-037','Mengemas pesanan toko','family-5','','["light", "medium"]',false),
('job-038','Mengambil barang pesanan dari rak','family-5','','["light", "medium"]',false),
('job-039','Menata gudang kecil','family-5','','["medium", "heavy"]',false),
('job-040','Bongkar muat stok toko','family-5','','["heavy"]',false),
('job-041','Memilah bahan makanan','family-6','','["light"]',false),
('job-042','Mencuci sayur atau buah','family-6','','["light", "medium"]',false),
('job-043','Menakar dan mengemas bahan','family-6','','["light"]',false),
('job-044','Membantu persiapan dapur','family-6','','["medium"]',false),
('job-045','Mengemas makanan','family-6','','["light", "medium"]',false),
('job-046','Menata meja atau pesanan makanan','family-6','','["light", "medium"]',false),
('job-047','Mencuci peralatan usaha','family-6','','["medium"]',false),
('job-048','Membersihkan area usaha setelah tutup','family-6','','["medium", "heavy"]',false),
('job-049','Menyusun goodie bag','family-7','','["light"]',false),
('job-050','Menyiapkan meja registrasi','family-7','','["light", "medium"]',false),
('job-051','Membantu registrasi tamu','family-7','','["light", "medium"]',false),
('job-052','Menata dekorasi meja','family-7','','["light"]',false),
('job-053','Menyiapkan perlengkapan stan','family-7','','["medium"]',false),
('job-054','Menata meja dan kursi acara','family-7','','["medium", "heavy"]',false),
('job-055','Membersihkan area setelah acara','family-7','','["medium", "heavy"]',false),
('job-056','Memindahkan perlengkapan acara','family-7','','["heavy"]',false),
('job-057','Mencuci sepeda','family-8','','["light", "medium"]',false),
('job-058','Mencuci motor','family-8','','["medium"]',false),
('job-059','Mencuci eksterior mobil','family-8','','["medium"]',false),
('job-060','Menyedot debu kabin','family-8','','["light", "medium"]',false),
('job-061','Membersihkan karpet kendaraan','family-8','','["medium"]',false),
('job-062','Membersihkan helm','family-8','','["light", "medium"]',false),
('job-063','Mengeringkan dan lap bodi kendaraan','family-8','','["light", "medium"]',false),
('job-064','Membersihkan jok bagian luar','family-8','','["light", "medium"]',false),
('job-065','Memilah benih','family-9','','["light"]',false),
('job-066','Menyiapkan wadah semai','family-9','','["light", "medium"]',false),
('job-067','Menanam bibit manual','family-9','','["medium"]',false),
('job-068','Menyiangi tanaman manual','family-9','','["medium"]',false),
('job-069','Memanen tanaman rendah manual','family-9','','["medium"]',false),
('job-070','Memilah hasil panen','family-9','','["light", "medium"]',false),
('job-071','Mengemas hasil panen','family-9','','["medium"]',false),
('job-072','Mengangkut hasil panen','family-9','','["heavy"]',false),
('job-073','Menyiapkan pakan','family-10','','["light", "medium"]',false),
('job-074','Memberi pakan hewan jinak','family-10','','["light", "medium"]',false),
('job-075','Mengisi wadah minum','family-10','','["light", "medium"]',false),
('job-076','Mengumpulkan telur','family-10','','["light", "medium"]',false),
('job-077','Memilah dan mengemas telur','family-10','','["light"]',false),
('job-078','Membersihkan kandang','family-10','','["medium", "heavy"]',false),
('job-079','Memindahkan pakan kemasan','family-10','','["heavy"]',false),
('job-080','Membantu mengganti alas kandang','family-10','','["medium", "heavy"]',false),
('job-081','Menakar pakan ikan','family-11','','["light"]',false),
('job-082','Memberi pakan dari tepian aman','family-11','','["light", "medium"]',false),
('job-083','Memilah hasil ikan di meja','family-11','','["medium"]',false),
('job-084','Mengemas hasil ikan','family-11','','["medium"]',false),
('job-085','Membersihkan wadah ikan','family-11','','["medium"]',false),
('job-086','Menjemur jaring dari daratan','family-11','','["medium"]',false),
('job-087','Melipat jaring dari daratan','family-11','','["medium"]',false),
('job-088','Mengangkut boks hasil ikan','family-11','','["heavy"]',false),
('job-089','Melipat kemasan karton','family-12','','["light"]',false),
('job-090','Menempel label produk','family-12','','["light"]',false),
('job-091','Memilah bahan kerajinan','family-12','','["light"]',false),
('job-092','Merangkai hiasan sederhana','family-12','','["light"]',false),
('job-093','Membantu menyelesaikan produk manual','family-12','','["light", "medium"]',false),
('job-094','Mengemas produk kerajinan','family-12','','["light", "medium"]',false),
('job-095','Memeriksa tampilan produk','family-12','','["light"]',false),
('job-096','Menata stok bahan kerajinan','family-12','','["medium"]',false),
('job-097','Merakit rak lepas sederhana','family-13','','["medium"]',false),
('job-098','Merakit perabot lepas sederhana','family-13','','["medium", "heavy"]',false),
('job-099','Mengencangkan sekrup perabot','family-13','','["light", "medium"]',false),
('job-100','Mengganti gagang perabot','family-13','','["light", "medium"]',false),
('job-101','Memasang lapik kaki perabot','family-13','','["light", "medium"]',false),
('job-102','Membersihkan permukaan sebelum dicat','family-13','','["medium"]',false),
('job-103','Mengecat bidang rendah','family-13','','["medium"]',false),
('job-104','Menutup perabot dan merapikan area kerja','family-13','','["light", "medium"]',false),
('job-105','Membantu antre','family-14','','["light", "medium"]',false),
('job-106','Membantu belanja dengan daftar','family-14','','["light", "medium"]',false),
('job-107','Membawa belanja dari titik serah','family-14','','["medium", "heavy"]',false),
('job-108','Mengambil laundry sekitar','family-14','','["light", "medium"]',false),
('job-109','Mengantar barang ringan dengan berjalan kaki','family-14','','["light", "medium"]',false),
('job-110','Mengambil pesanan toko dengan berjalan kaki','family-14','','["light", "medium"]',false),
('job-111','Menata perlengkapan rumah tangga','family-14','','["light", "medium"]',false),
('job-112','Membantu persiapan perjalanan di rumah','family-14','','["light", "medium"]',false),
('job-113','Memilah berkas nonsensitif','family-15','','["light"]',false),
('job-114','Memasukkan data stok','family-15','','["light"]',false),
('job-115','Mencatat daftar barang','family-15','','["light", "medium"]',false),
('job-116','Menempel label pengiriman','family-15','','["light"]',false),
('job-117','Mengurutkan paket berdasarkan label','family-15','','["light", "medium"]',false),
('job-118','Menjaga meja informasi sementara','family-15','','["light", "medium"]',false),
('job-119','Membantu stan penjualan','family-15','','["light", "medium"]',false),
('job-120','Memotret katalog barang dengan ponsel pemilik','family-15','','["light", "medium"]',false),
('job-121','Memilah kardus kering','family-16','','["light", "medium"]',false),
('job-122','Melipat kardus bekas','family-16','','["light", "medium"]',false),
('job-123','Memilah botol plastik bersih','family-16','','["light", "medium"]',false),
('job-124','Mengelompokkan barang donasi','family-16','','["light", "medium"]',false),
('job-125','Mengemas barang bekas layak pakai','family-16','','["medium"]',false),
('job-126','Menata barang bekas di penyimpanan','family-16','','["medium", "heavy"]',false),
('job-127','Mengangkut karung barang daur ulang umum','family-16','','["heavy"]',false),
('job-128','Membersihkan tempat pemilahan barang umum','family-16','','["medium", "heavy"]',false);
create table upahgo_private.discovery_details (
 user_id uuid references auth.users on delete cascade, role text check(role in('worker','employer')),
 accepted_efforts jsonb not null default '[]', work_context jsonb,
 primary key(user_id,role)
);
alter table upahgo_private.job_catalog enable row level security;
alter table upahgo_private.discovery_details enable row level security;
create function upahgo_private.validate_work_context(c jsonb) returns void language plpgsql immutable set search_path='' as $$
declare k text; n numeric; bounds jsonb:='{"durationMinutes":[1,720],"quantity":[1,1000],"loadKg":[0,500],"floors":[0,50],"distanceMeters":[0,10000],"workers":[1,50]}';
begin
 if c is null or c='null'::jsonb then return; end if;
 if jsonb_typeof(c) is distinct from 'object' then raise exception 'CONTEXT_INVALID'; end if;
 perform upahgo_private.check_keys(c,array['durationMinutes','quantity','loadKg','floors','lift','distanceMeters','workers','tools']);
 for k in select jsonb_object_keys(bounds) loop
  if jsonb_typeof(c->k) is distinct from 'number' then raise exception 'CONTEXT_INVALID'; end if;
  n:=(c->>k)::numeric;
  if n<(bounds->k->>0)::numeric or n>(bounds->k->>1)::numeric or (k<>'loadKg' and n<>trunc(n)) then raise exception 'CONTEXT_INVALID'; end if;
 end loop;
 if jsonb_typeof(c->'lift') is distinct from 'boolean' or jsonb_typeof(c->'tools') is distinct from 'string'
  or length(trim(c->>'tools')) not between 2 and 160 or c->>'tools' ~* '(https?:|www\.|\+?[0-9][0-9 ()-]{7,})' then raise exception 'CONTEXT_INVALID'; end if;
end $$;
create function upahgo_private.estimate_effort(tags text[], c jsonb) returns text language plpgsql stable set search_path='' as $$
begin
 if c is null or c='null'::jsonb or cardinality(tags)=0 or exists(select 1 from unnest(tags) t where not exists(select 1 from upahgo_private.job_catalog where id=t)) then return 'unknown'; end if;
 if 'water-carry'=any(tags) or (c->>'loadKg')::numeric>=15 or (c->>'durationMinutes')::numeric>240
  or ((c->>'floors')::numeric>0 and not (c->>'lift')::boolean and (c->>'loadKg')::numeric>5)
  or exists(select 1 from upahgo_private.job_catalog where id=any(tags) and baseline ? 'heavy') then return 'heavy'; end if;
 if (c->>'loadKg')::numeric>0 or (c->>'durationMinutes')::numeric>60 or (c->>'quantity')::numeric>2 or (c->>'distanceMeters')::numeric>100
  or exists(select 1 from upahgo_private.job_catalog where id=any(tags) and baseline='["medium"]') then return 'medium'; end if;
 return 'light';
end $$;
create or replace function upahgo_private.profile_json(p upahgo_private.profiles) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',p.id,'name',p.name,'region',p.region,'areaId',p.area_id,'role',p.role,'tags',p.tags,'bio',p.bio,
 'status',p.status,'whatsappReady',exists(select 1 from auth.users where id=p.id and phone is not null and phone_confirmed_at is not null),
 'visibleUntil',(select expires_at from upahgo_private.presences where user_id=p.id and expires_at>now()),
 'acceptedEfforts',coalesce((select accepted_efforts from upahgo_private.discovery_details where user_id=p.id and role=p.role),'[]'),
 'workContext',(select work_context from upahgo_private.discovery_details where user_id=p.id and role=p.role));
$$;
alter function public.upahgo_action(text,jsonb) set schema upahgo_private;
alter function upahgo_private.upahgo_action(text,jsonb) rename to geo_action;
create function public.upahgo_action(p_operation text,p_args jsonb default '{}'::jsonb) returns jsonb
 language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); expected bytea; secret text; result jsonb;
 a upahgo_private.accounts; p upahgo_private.profiles; l upahgo_private.account_locations;
 requested_role text; area uuid; query text; category text; tag text; effort text; sort text; page_offset integer:=0;
 context jsonb; accepted jsonb; details upahgo_private.discovery_details;
begin
 if p_operation not in('discover','profile','save_profile') then return upahgo_private.geo_action(p_operation,p_args); end if;
 if actor is null then raise exception 'UNAUTHENTICATED'; end if;
 select secret_hash into expected from upahgo_private.gateway_config where singleton;
 secret:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-upahgo-gateway','');
 if expected is null or length(secret)<32 or extensions.digest(secret,'sha256')<>expected then raise exception 'GATEWAY_NOT_CONFIGURED'; end if;
 if jsonb_typeof(p_args) is distinct from 'object' or octet_length(p_args::text)>16384 then raise exception 'INVALID_INPUT'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into a from upahgo_private.accounts where id=actor;
 select * into p from upahgo_private.profiles where id=actor;
 if a.status is distinct from 'active' or (p.id is not null and p.status<>'active') then raise exception 'ACCOUNT_RESTRICTED'; end if;
 if a.role is null then raise exception 'ROLE_REQUIRED'; end if;
 if p_operation='save_profile' then
  perform upahgo_private.check_keys(p_args,array['name','region','areaId','role','tags','bio','workContext','acceptedEfforts']);
  select * into details from upahgo_private.discovery_details where user_id=actor and role=a.role;
  context:=case when p_args ? 'workContext' then nullif(p_args->'workContext','null'::jsonb) else details.work_context end;
  accepted:=case when p_args ? 'acceptedEfforts' then p_args->'acceptedEfforts' else coalesce(details.accepted_efforts,'[]'::jsonb) end;
  perform upahgo_private.validate_work_context(context);
  if jsonb_typeof(accepted) is distinct from 'array' then raise exception 'CONTEXT_INVALID'; end if;
  if jsonb_array_length(accepted)>3 or exists(select 1 from jsonb_array_elements_text(accepted) v where v not in('light','medium','heavy'))
   or jsonb_array_length(accepted)<>(select count(distinct v) from jsonb_array_elements_text(accepted) v) then raise exception 'CONTEXT_INVALID'; end if;
  result:=upahgo_private.geo_action(p_operation,p_args-'workContext'-'acceptedEfforts');
  insert into upahgo_private.discovery_details values(actor,a.role,case when a.role='worker' then accepted else '[]'::jsonb end,case when a.role='employer' then context else null end)
   on conflict(user_id,role) do update set accepted_efforts=excluded.accepted_efforts,work_context=excluded.work_context;
  select * into p from upahgo_private.profiles where id=actor;
  return upahgo_private.profile_json(p);
 end if;
 perform upahgo_private.limit_action(actor,'all',90);
 perform upahgo_private.check_keys(p_args,case when p_operation='profile' then array['id','role'] else array['areaId','role','tag','category','query','effort','sort','offset'] end);
 select * into l from upahgo_private.account_locations where user_id=actor;
 if l.user_id is null then raise exception 'LOCATION_REQUIRED'; end if;
 if l.captured_at<now()-interval '30 minutes' then raise exception 'LOCATION_STALE'; end if;
 if not exists(select 1 from upahgo_private.cities where id=l.city_id and enabled) then raise exception 'CITY_UNAVAILABLE'; end if;
 requested_role:=p_args->>'role';
 if requested_role is null or requested_role not in('worker','employer') then raise exception 'INVALID_INPUT'; end if;
 area:=nullif(p_args->>'areaId','')::uuid;
 if area is not null and not exists(select 1 from upahgo_private.areas where id=area and city_id=l.city_id and enabled) then raise exception 'CITY_MISMATCH'; end if;
 tag:=nullif(p_args->>'tag',''); category:=nullif(p_args->>'category',''); effort:=nullif(p_args->>'effort',''); query:=trim(coalesce(p_args->>'query','')); sort:=coalesce(p_args->>'sort','distance');
 if tag is not null and not exists(select 1 from upahgo_private.tags where id=tag and enabled) then raise exception 'TAGS_INVALID'; end if;
 if (p_args ? 'query' and jsonb_typeof(p_args->'query') is distinct from 'string') or length(query)>80
  or (category is not null and not exists(select 1 from upahgo_private.job_catalog where category_id=category))
  or (effort is not null and effort not in('light','medium','heavy','unknown')) or sort not in('distance','rating') then raise exception 'FILTER_INVALID'; end if;
 if p_args ? 'offset' then
  if jsonb_typeof(p_args->'offset') is distinct from 'number' or (p_args->>'offset')::numeric not between 0 and 1000 or (p_args->>'offset')::numeric<>trunc((p_args->>'offset')::numeric) then raise exception 'FILTER_INVALID'; end if;
  page_offset:=(p_args->>'offset')::integer;
 end if;
 select coalesce(jsonb_agg(item order by case when sort='rating' then average end desc nulls last,distance,id),'[]') into result from (
  select x.id,upahgo_private.distance_km(l.latitude,l.longitude,v.latitude,v.longitude) distance, ratings.average,
   jsonb_build_object('id',x.id,'name',x.name,'role',v.role,'areaId',ar.id,'areaLabel',ar.label,'latitude',v.latitude,'longitude',v.longitude,
    'tags',v.tags,'bio',x.bio,'expiresAt',least(v.expires_at,loc.captured_at+interval '30 minutes'),
    'distanceKm',round(upahgo_private.distance_km(l.latitude,l.longitude,v.latitude,v.longitude)::numeric,1),
    'ratingAverage',ratings.average,'ratingCount',ratings.count,'acceptedEfforts',coalesce(d.accepted_efforts,'[]'),
    'workContext',d.work_context,'effort',upahgo_private.estimate_effort(v.tags,d.work_context)) item
  from upahgo_private.presences v join upahgo_private.profiles x on x.id=v.user_id join upahgo_private.areas ar on ar.id=v.area_id
   join upahgo_private.account_locations loc on loc.user_id=x.id
   left join upahgo_private.discovery_details d on d.user_id=x.id and d.role=v.role
   cross join lateral (select round(avg(score),1) average,count(*) count from upahgo_private.reviews where target_id=x.id and target_role=v.role) ratings
  where x.id<>actor and x.status='active' and v.expires_at>now() and loc.captured_at>now()-interval '30 minutes'
   and ar.enabled and ar.city_id=l.city_id and v.city_id=l.city_id and v.role=requested_role
   and v.latitude is not null and v.longitude is not null and not upahgo_private.blocked(actor,x.id)
   and upahgo_private.distance_km(l.latitude,l.longitude,v.latitude,v.longitude)<=l.radius_km
   and ((p_operation='profile' and x.id=(p_args->>'id')::uuid) or (p_operation='discover' and (area is null or ar.id=area)
    and (tag is null or tag=any(v.tags))
    and (category is null or exists(select 1 from upahgo_private.job_catalog j where j.id=any(v.tags) and j.category_id=category))
    and (query='' or strpos(lower(x.name||' '||coalesce((select string_agg(j.label||' '||j.aliases,' ') from upahgo_private.job_catalog j where j.id=any(v.tags)),'')),lower(query))>0)
    and (effort is null or (v.role='worker' and coalesce(d.accepted_efforts,'[]') ? effort) or (v.role='employer' and upahgo_private.estimate_effort(v.tags,d.work_context)=effort))))
  order by case when sort='rating' then ratings.average end desc nulls last,distance,x.id limit 40 offset page_offset
 ) q;
 if p_operation='profile' then
  if jsonb_array_length(result)=0 then raise exception 'UNAVAILABLE'; end if;
  return result->0;
 end if;
 return result;
end $$;
revoke all on function public.upahgo_action(text,jsonb) from public,anon;
grant execute on function public.upahgo_action(text,jsonb) to authenticated;
revoke all on all functions in schema upahgo_private from public,anon,authenticated;
comment on table upahgo_private.discovery_details is 'Role-specific preferences and public work context; no safety certification. Editing clears presence via existing profile flow.';
commit;
