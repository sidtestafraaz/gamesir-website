/*
  # Update controllers with proper protocol distribution

  1. Changes
    - Update existing controllers with proper wired/wireless/bluetooth protocol distribution
    - Clear and repopulate with realistic protocol support based on controller types

  2. Protocol Distribution Logic
    - Wired controllers (USB-C, Lightning): Support all protocols when wired
    - Wireless controllers: Support protocols over 2.4GHz and Bluetooth
    - Bluetooth-only controllers: Support HID protocol primarily
*/

-- Update controllers with proper protocol distribution
UPDATE controllers SET 
  wired_protocols = CASE 
    WHEN name LIKE '%USB-C%' OR name LIKE '%Lightning%' THEN ARRAY['HID', 'XINPUT']
    WHEN name LIKE '%G7%' OR name LIKE '%G4%' OR name LIKE '%T4%' THEN ARRAY['HID', 'XINPUT', 'DS4']
    ELSE ARRAY['HID']
  END,
  wireless_protocols = CASE 
    WHEN name LIKE '%G7%' OR name LIKE '%G4%' OR name LIKE '%T4%' OR name LIKE '%Kaleid%' THEN ARRAY['HID', 'XINPUT']
    WHEN name LIKE '%USB-C%' OR name LIKE '%Lightning%' THEN ARRAY[]::text[]
    ELSE ARRAY['HID']
  END,
  bluetooth_protocols = CASE 
    WHEN name LIKE '%Bluetooth%' OR name NOT LIKE '%USB-C%' AND name NOT LIKE '%Lightning%' THEN ARRAY['HID']
    WHEN name LIKE '%G7%' OR name LIKE '%G4%' OR name LIKE '%T4%' OR name LIKE '%Kaleid%' THEN ARRAY['HID', 'XINPUT']
    ELSE ARRAY[]::text[]
  END;

-- Ensure all controllers have at least one protocol in each category where applicable
UPDATE controllers SET 
  wired_protocols = CASE 
    WHEN array_length(wired_protocols, 1) IS NULL OR array_length(wired_protocols, 1) = 0 
    THEN ARRAY['HID']
    ELSE wired_protocols
  END
WHERE name NOT LIKE '%Bluetooth%';

UPDATE controllers SET 
  bluetooth_protocols = CASE 
    WHEN array_length(bluetooth_protocols, 1) IS NULL OR array_length(bluetooth_protocols, 1) = 0 
    THEN ARRAY['HID']
    ELSE bluetooth_protocols
  END
WHERE name NOT LIKE '%USB-C%' AND name NOT LIKE '%Lightning%';