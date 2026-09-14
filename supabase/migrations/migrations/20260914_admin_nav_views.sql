-- Mencatat kapan terakhir admin tertentu membuka tiap tab admin.
-- Dipakai untuk menghitung badge "belum dilihat", terpisah dari status resolve/dismiss.
create table if not exists admin_nav_views (
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  last_viewed_at timestamptz not null default now(),
  primary key (admin_user_id, category)
);

alter table admin_nav_views enable row level security;
-- Sengaja tidak ada policy sama sekali — hanya diakses lewat service-role
-- (admin client) di server actions, konsisten dengan pola admin lain di proyek ini.
