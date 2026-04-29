alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.character_inventory enable row level security;
alter table public.character_equipment enable row level security;
alter table public.chat_messages enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can read their own characters"
  on public.characters for select using (auth.uid() = user_id);

create policy "Users can insert their own characters"
  on public.characters for insert with check (auth.uid() = user_id);

create policy "Users can update their own characters"
  on public.characters for update using (auth.uid() = user_id);

create policy "Users can read inventory for their own characters"
  on public.character_inventory for select
  using (
    exists (
      select 1 from public.characters c
      where c.id = character_inventory.character_id and c.user_id = auth.uid()
    )
  );

create policy "Users can read equipment for their own characters"
  on public.character_equipment for select
  using (
    exists (
      select 1 from public.characters c
      where c.id = character_equipment.character_id and c.user_id = auth.uid()
    )
  );

create policy "Users can read item definitions"
  on public.item_definitions for select using (true);

create policy "Users can read chat messages"
  on public.chat_messages for select using (true);
