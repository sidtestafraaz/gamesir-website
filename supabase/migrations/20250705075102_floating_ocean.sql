/*
  # Update protocols and connectivity system

  1. Changes
    - Add NS protocol support
    - Simplify connectivity to wired/2.4ghz and bluetooth only
    - Update existing controllers with new protocol structure
    - Remove wireless_protocols column (merge with wired)

  2. Protocol Structure
    - wired_protocols: Protocols available via wired/2.4GHz connection
    - bluetooth_protocols: Protocols available via Bluetooth connection
    - NS protocol added to supported options
*/

-- Add NS protocol to existing controllers where appropriate
UPDATE controllers SET 
  supported_protocols = array_append(supported_protocols, 'NS')
WHERE name LIKE '%G7%' OR name LIKE '%G4%' OR name LIKE '%T4%' OR name LIKE '%Kaleid%';

-- Remove wireless_protocols column and merge with wired_protocols
DO $$
BEGIN
  -- First, merge wireless protocols into wired protocols
  UPDATE controllers SET 
    wired_protocols = array(
      SELECT DISTINCT unnest(
        COALESCE(wired_protocols, ARRAY[]::text[]) || 
        COALESCE(wireless_protocols, ARRAY[]::text[])
      )
    );
  
  -- Then drop the wireless_protocols column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'controllers' AND column_name = 'wireless_protocols'
  ) THEN
    ALTER TABLE controllers DROP COLUMN wireless_protocols;
  END IF;
END $$;

-- Update controllers with proper protocol distribution
UPDATE controllers SET 
  wired_protocols = CASE 
    WHEN name LIKE '%G7%' OR name LIKE '%G4%' OR name LIKE '%T4%' OR name LIKE '%Kaleid%' 
    THEN ARRAY['HID', 'XINPUT', 'DS4', 'NS']
    WHEN name LIKE '%USB-C%' OR name LIKE '%Lightning%' 
    THEN ARRAY['HID', 'XINPUT']
    ELSE ARRAY['HID']
  END,
  bluetooth_protocols = CASE 
    WHEN name LIKE '%G7%' OR name LIKE '%G4%' OR name LIKE '%T4%' OR name LIKE '%Kaleid%' 
    THEN ARRAY['HID', 'DS4']
    WHEN name NOT LIKE '%USB-C%' AND name NOT LIKE '%Lightning%' 
    THEN ARRAY['HID']
    ELSE ARRAY[]::text[]
  END;

-- Update supported_protocols to include all available protocols
UPDATE controllers SET 
  supported_protocols = array(
    SELECT DISTINCT unnest(
      COALESCE(wired_protocols, ARRAY[]::text[]) || 
      COALESCE(bluetooth_protocols, ARRAY[]::text[])
    )
  );