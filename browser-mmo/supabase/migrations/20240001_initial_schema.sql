-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- characters
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sprite_id text not null default 'default_player',
  map_id text not null default 'starter_map',
  x integer not null default 10,
  y integer not null default 10,
  level integer not null default 1,
  experience integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

-- item definitions (static, server-managed)
create table if not exists public.item_definitions (
  id text primary key,
  name text not null,
  description text,
  item_type text not null,
  equipment_slot text,
  icon_path text,
  sprite_id text,
  stats jsonb not null default '{}'::jsonb,
  stackable boolean not null default false,
  max_stack integer not null default 1,
  created_at timestamptz not null default now()
);

-- character inventory
create table if not exists public.character_inventory (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  item_id text not null references public.item_definitions(id),
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

-- equipped items per slot
create table if not exists public.character_equipment (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  slot text not null,
  inventory_item_id uuid not null references public.character_inventory(id) on delete cascade,
  unique(character_id, slot)
);

-- optional chat log
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters(id) on delete set null,
  character_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);
