import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Authentication helper for approver tokens
export const authenticateWithToken = async (token: string) => {
  try {
    // Verify token exists in approvers table
    const { data: approver, error } = await supabase
      .from('approvers')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !approver) {
      throw new Error('Invalid token');
    }

    // Store approver info in localStorage for session management
    localStorage.setItem('approver_session', JSON.stringify({
      id: approver.id,
      name: approver.name,
      token: approver.token,
      authenticated_at: new Date().toISOString()
    }));

    return approver;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  try {
    const session = localStorage.getItem('approver_session');
    return session !== null;
  } catch {
    return false;
  }
};

// Get current approver session
export const getCurrentApprover = () => {
  try {
    const session = localStorage.getItem('approver_session');
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
};

// Sign out
export const signOut = () => {
  localStorage.removeItem('approver_session');
};

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
  rejected_by?: string;
  rejected_reason?:string;
  rejected_at?: string;
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
  android_gip?: string;
  android_gtouch?: string;
  ios_hid?: string;
  ios_xinput?: string;
  ios_ds4?: string;
  ios_ns?: string;
  ios_gip?: string;
  ios_gtouch?: string;
  edited_by_admin?: boolean;
  edited_at?: string;
  testing_controllers?: Controller[];
  testing_controller?: Controller;
};

export type GameUpdate = {
  id: string;
  original_game_id: string;
  android_tested?: boolean;
  ios_tested?: boolean;
  android_hid?: string;
  android_xinput?: string;
  android_ds4?: string;
  android_ns?: string;
  android_gip?: string;
  android_gtouch?: string;
  ios_hid?: string;
  ios_xinput?: string;
  ios_ds4?: string;
  ios_ns?: string;
  ios_gip?: string;
  ios_gtouch?: string;
  testing_controller_id?: string;
  testing_controller_ids?: string[];
  testing_notes?: string;
  discord_username?: string;
  is_approved?: boolean;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  rejected_by?: string;
  rejected_at?: string;
  created_at?: string;
  edited_by_admin?: boolean;
  edited_at?: string;
  testing_controllers?: Controller[];
  testing_controller: Controller;
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
  is_supported: "true" | "false" | "gtouch-only";
  supported_protocols: Array<{
    protocol: string;
    connectivity: 'Wired/2.4GHz/Bluetooth' | 'Wired/2.4GHz' | 'Bluetooth';
  }>;
  connectivity_modes: string[];
  testing_controller?: Controller;
  testing_controllers?: Controller[];
};