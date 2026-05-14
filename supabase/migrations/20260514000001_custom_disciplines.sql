-- standard_disciplines: dynamic list of discipline chips; seeded here, admin can add via promote
create table if not exists standard_disciplines (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order int not null default 999,
  promoted_from_custom boolean not null default false,
  created_at timestamptz not null default now()
);

alter table standard_disciplines enable row level security;

create policy "Anyone can read standard_disciplines"
  on standard_disciplines for select using (true);

insert into standard_disciplines (name, display_order) values
  ('Cinematographer', 1),
  ('Photographer', 2),
  ('Filmmaker', 3),
  ('Illustrator', 4),
  ('Musician', 5),
  ('Graphic Designer', 6),
  ('Muralist', 7),
  ('Animator', 8),
  ('Art Director', 9),
  ('Dancer', 10),
  ('Poet', 11),
  ('Sound Designer', 12),
  ('Sculptor', 13),
  ('Calligrapher', 14),
  ('Fashion Designer', 15),
  ('Textile Designer', 16),
  ('Theatre', 17),
  ('Journalist', 18),
  ('Architect', 19),
  ('Painter', 20),
  ('Ceramicist', 21),
  ('Street Artist', 22),
  ('Comedian', 23)
on conflict (name) do nothing;

-- custom_discipline_submissions: every time a user saves a non-standard discipline
create table if not exists custom_discipline_submissions (
  id uuid primary key default gen_random_uuid(),
  value text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists cds_value_idx on custom_discipline_submissions(lower(value));
create index if not exists cds_user_idx  on custom_discipline_submissions(user_id);

alter table custom_discipline_submissions enable row level security;

create policy "Users can insert own custom submissions"
  on custom_discipline_submissions for insert
  with check (auth.uid() = user_id);

create policy "Service role can select all custom submissions"
  on custom_discipline_submissions for select
  using (true);
