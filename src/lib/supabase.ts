import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Game = {
  id: string;
  name: string;
  supported_protocols: string[];
  description: string;
  image_url?: string;
  igdb_id?: number;
  created_at?: string;
  is_approved?: boolean;
  approved_by?: string;
  approved_at?: string;
  testing_controller_id?: string;
  testing_controller_ids?: string[];
  testing_notes?: string;
  discord_username?: string;
  // New Android/iOS testing fields
  android_tested?: boolean;
  ios_tested?: boolean;
  android_hid?: string;
  android_xinput?: string;
  android_ds4?: string;
  android_ns?: string;
  ios_hid?: string;
  ios_xinput?: string;
  ios_ds4?: string;
  ios_ns?: string;
};

export type Controller = {
  id: string;
  name: string;
  supported_protocols: string[];
  wired_protocols: string[];
  bluetooth_protocols: string[];
  manufacturer: string;
  created_at?: string;
};

export type Approver = {
  id: string;
  name: string;
  token: string;
  created_at?: string;
};

export type GameControllerCompatibility = {
  game: Game;
  controller?: Controller;
  is_supported: boolean;
  supported_protocols: Array<{
    protocol: string;
    connectivity: 'Wired/2.4GHz/Bluetooth' | 'Wired/2.4GHz' | 'Bluetooth';
  }>;
  connectivity_modes: string[];
  testing_controller?: Controller;
  testing_controllers?: Controller[];
};