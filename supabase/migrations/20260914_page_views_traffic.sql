create table if not exists page_views (
  id bigint generated always as identity primary key,
  page_type text not null check (page_type in ('site', 'seller_profile')),
  path text not null,
  seller_id uuid references auth.users(id) on delete cascade,
  visitor_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists page_views_seller_id_created_at_idx
  on page_views (seller_id, created_at);
create index if not exists page_views_created_at_idx
  on page_views (created_at);

alter table page_views enable row level security;

-- Siapa saja (termasuk pengunjung belum login) boleh mencatat kunjungan
create policy "Anyone can insert page views"
  on page_views for insert
  with check (true);

-- Penjual cuma boleh SELECT baris trafik toko sendiri langsung dari tabel
-- (jalur utama tetap lewat RPC di bawah, ini cuma jaring pengaman)
create policy "Sellers can view own traffic rows"
  on page_views for select
  using (auth.uid() = seller_id);

-- Ringkasan: total views + pengunjung unik sejak p_since (NULL = sepanjang waktu).
-- p_seller_id NULL = admin lihat SELURUH traffic situs (butuh is_admin()).
-- p_seller_id terisi = trafik toko tertentu (hanya boleh diri sendiri atau admin).
create or replace function get_traffic_stats(p_seller_id uuid, p_since timestamptz)
returns table(views bigint, unique_visitors bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seller_id is null then
    if not is_admin() then
      raise exception 'not authorized';
    end if;
  else
    if auth.uid() is distinct from p_seller_id and not is_admin() then
      raise exception 'not authorized';
    end if;
  end if;

  return query
    select
      count(*)::bigint as views,
      count(distinct visitor_hash)::bigint as unique_visitors
    from page_views
    where (p_seller_id is null or seller_id = p_seller_id)
      and (p_since is null or created_at >= p_since);
end;
$$;

grant execute on function get_traffic_stats(uuid, timestamptz) to authenticated, anon;

-- Seri waktu untuk grafik, dikelompokkan per hari atau per bulan
create or replace function get_traffic_series(p_seller_id uuid, p_since timestamptz, p_bucket text)
returns table(bucket_start timestamptz, views bigint, unique_visitors bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_bucket not in ('day', 'month') then
    raise exception 'invalid bucket';
  end if;

  if p_seller_id is null then
    if not is_admin() then
      raise exception 'not authorized';
    end if;
  else
    if auth.uid() is distinct from p_seller_id and not is_admin() then
      raise exception 'not authorized';
    end if;
  end if;

  return query
    select
      date_trunc(p_bucket, page_views.created_at) as bucket_start,
      count(*)::bigint as views,
      count(distinct visitor_hash)::bigint as unique_visitors
    from page_views
    where (p_seller_id is null or seller_id = p_seller_id)
      and (p_since is null or created_at >= p_since)
    group by 1
    order by 1;
end;
$$;

grant execute on function get_traffic_series(uuid, timestamptz, text) to authenticated, anon;
