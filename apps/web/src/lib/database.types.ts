export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; created_at: string };
        Insert: { id: string; display_name: string; created_at?: string };
        Update: { display_name?: string };
        Relationships: [];
      };
      characters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          sprite_id: string;
          map_id: string;
          x: number;
          y: number;
          level: number;
          experience: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          sprite_id?: string;
          map_id?: string;
          x?: number;
          y?: number;
          level?: number;
          experience?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          sprite_id?: string;
          map_id?: string;
          x?: number;
          y?: number;
          level?: number;
          experience?: number;
        };
        Relationships: [];
      };
      item_definitions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          item_type: string;
          equipment_slot: string | null;
          icon_path: string | null;
          sprite_id: string | null;
          stats: Json;
          stackable: boolean;
          max_stack: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          item_type: string;
          equipment_slot?: string | null;
          icon_path?: string | null;
          sprite_id?: string | null;
          stats?: Json;
          stackable?: boolean;
          max_stack?: number;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      character_inventory: {
        Row: {
          id: string;
          character_id: string;
          item_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          item_id: string;
          quantity?: number;
          created_at?: string;
        };
        Update: { quantity?: number };
        Relationships: [];
      };
      character_equipment: {
        Row: {
          id: string;
          character_id: string;
          slot: string;
          inventory_item_id: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          slot: string;
          inventory_item_id: string;
        };
        Update: { inventory_item_id?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
