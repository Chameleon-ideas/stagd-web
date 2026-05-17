alter table artist_profiles
  add column if not exists portfolio_theme text not null default 'dark'
  check (portfolio_theme in ('light', 'dark'));
