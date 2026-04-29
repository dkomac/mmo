insert into public.item_definitions
  (id, name, description, item_type, equipment_slot, icon_path, stats, stackable, max_stack)
values
  ('iron_sword',    'Iron Sword',    'A basic iron sword.',          'weapon',     'weapon', 'items/iron_sword.png',    '{"attack": 3}'::jsonb,  false, 1),
  ('wooden_shield', 'Wooden Shield', 'A simple wooden shield.',      'armor',      'shield', 'items/wooden_shield.png', '{"defense": 2}'::jsonb, false, 1),
  ('health_potion', 'Health Potion', 'Restores a small amount of health.', 'consumable', null, 'items/health_potion.png', '{"heal": 25}'::jsonb,  true,  20)
on conflict (id) do nothing;
