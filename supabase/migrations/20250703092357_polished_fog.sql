/*
  # Populate GameSir Controllers Database

  1. Data Cleanup
    - Clear existing games and controllers data
  
  2. New Data
    - Add comprehensive list of GameSir controllers
    - Include proper protocol support and manufacturer info
  
  3. Security
    - Maintain existing RLS policies
*/

-- Clear existing data
DELETE FROM games;
DELETE FROM controllers;

-- Insert GameSir Controllers
INSERT INTO controllers (name, supported_protocols, manufacturer) VALUES
  ('GameSir G7 SE', ARRAY['XINPUT', 'HID'], 'GameSir'),
  ('GameSir G7', ARRAY['XINPUT', 'HID'], 'GameSir'),
  ('GameSir G4 Pro', ARRAY['XINPUT', 'HID', 'DS4'], 'GameSir'),
  ('GameSir G4s', ARRAY['XINPUT', 'HID'], 'GameSir'),
  ('GameSir G3s', ARRAY['XINPUT', 'HID'], 'GameSir'),
  ('GameSir T4 Pro', ARRAY['XINPUT', 'HID', 'DS4'], 'GameSir'),
  ('GameSir T4 Mini', ARRAY['XINPUT', 'HID'], 'GameSir'),
  ('GameSir T1s', ARRAY['HID'], 'GameSir'),
  ('GameSir T1d', ARRAY['HID'], 'GameSir'),
  ('GameSir X2 Bluetooth', ARRAY['HID'], 'GameSir'),
  ('GameSir X2 USB-C', ARRAY['HID'], 'GameSir'),
  ('GameSir X2 Lightning', ARRAY['HID'], 'GameSir'),
  ('GameSir X3 Type-C', ARRAY['HID'], 'GameSir'),
  ('GameSir F4 Falcon', ARRAY['HID'], 'GameSir'),
  ('GameSir F7 Claw', ARRAY['HID'], 'GameSir'),
  ('GameSir Kaleid Flux', ARRAY['XINPUT', 'HID', 'DS4'], 'GameSir'),
  ('GameSir Nova Lite', ARRAY['XINPUT', 'HID'], 'GameSir'),
  ('GameSir Tarantula Pro', ARRAY['XINPUT', 'HID'], 'GameSir'),
  ('GameSir VX AimSwitch', ARRAY['HID'], 'GameSir'),
  ('GameSir VX2 AimBox', ARRAY['HID'], 'GameSir');