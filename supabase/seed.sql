insert into public.item_definitions
  (id, name, description, item_type, equipment_slot, icon_path, stats, stackable, max_stack)
values
  -- Weapons
  ('iron_sword',    'Iron Sword',    'A basic iron sword.',              'weapon',     'weapon', 'items/iron_sword.png',    '{"attack": 3}'::jsonb,              false, 1),
  ('steel_sword',   'Steel Sword',   'A finely forged steel blade.',     'weapon',     'weapon', 'items/steel_sword.png',   '{"attack": 7}'::jsonb,              false, 1),
  ('oak_staff',     'Oak Staff',     'A gnarled wooden staff.',          'weapon',     'weapon', 'items/oak_staff.png',     '{"attack": 2, "magic": 5}'::jsonb,  false, 1),
  -- Shields
  ('wooden_shield', 'Wooden Shield', 'A simple wooden shield.',          'armor',      'shield', 'items/wooden_shield.png', '{"defense": 2}'::jsonb,             false, 1),
  ('tower_shield',  'Tower Shield',  'Heavy steel tower shield.',        'armor',      'shield', 'items/tower_shield.png',  '{"defense": 8}'::jsonb,             false, 1),
  -- Head
  ('iron_helmet',   'Iron Helmet',   'A sturdy iron helm.',              'armor',      'head',   'items/iron_helmet.png',   '{"defense": 3}'::jsonb,             false, 1),
  ('hood',          'Hood',          'A dark hooded cloak.',             'armor',      'head',   'items/hood.png',          '{"defense": 1, "magic": 2}'::jsonb, false, 1),
  -- Chest
  ('chain_mail',    'Chain Mail',    'Interlocking iron rings.',         'armor',      'chest',  'items/chain_mail.png',    '{"defense": 5}'::jsonb,             false, 1),
  ('leather_armor', 'Leather Armor', 'Light and flexible leather.',      'armor',      'chest',  'items/leather_armor.png', '{"defense": 3, "speed": 1}'::jsonb, false, 1),
  -- Legs
  ('iron_greaves',  'Iron Greaves',  'Heavy iron leg plates.',           'armor',      'legs',   'items/iron_greaves.png',  '{"defense": 4}'::jsonb,             false, 1),
  -- Boots
  ('iron_boots',    'Iron Boots',    'Heavy iron boots.',                'armor',      'boots',  'items/iron_boots.png',    '{"defense": 2}'::jsonb,             false, 1),
  ('swift_boots',   'Swift Boots',   'Enchanted boots of speed.',        'armor',      'boots',  'items/swift_boots.png',   '{"defense": 1, "speed": 3}'::jsonb, false, 1),
  -- Jewelry
  ('gold_ring',     'Gold Ring',     'A simple band of gold.',           'jewelry',    'ring',   'items/gold_ring.png',     '{"magic": 3}'::jsonb,               false, 1),
  ('silver_amulet', 'Silver Amulet', 'An amulet of warding.',            'jewelry',    'amulet', 'items/silver_amulet.png', '{"defense": 2, "magic": 2}'::jsonb, false, 1),
  -- Consumables
  ('health_potion', 'Health Potion', 'Restores a small amount of HP.',   'consumable', null,     'items/health_potion.png', '{"heal": 25}'::jsonb,               true,  20),
  ('mana_potion',   'Mana Potion',   'Restores a small amount of MP.',   'consumable', null,     'items/mana_potion.png',   '{"mana": 20}'::jsonb,               true,  20),
  ('elixir',        'Elixir',        'Restores both HP and MP.',         'consumable', null,     'items/elixir.png',        '{"heal": 15, "mana": 15}'::jsonb,   true,  10)
on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  stats       = excluded.stats,
  icon_path   = excluded.icon_path;
