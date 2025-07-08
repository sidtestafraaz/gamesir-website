/*
  # Update games table for Android/iOS testing structure

  1. New Tables
    - Update games table with new testing structure
    - Remove old supported_protocols column
    - Add android_tested and ios_tested boolean fields
    - Add protocol connectivity fields for each platform

  2. New Fields
    - android_tested: boolean for Android testing
    - ios_tested: boolean for iOS testing
    - android_hid: text for HID connectivity on Android
    - android_xinput: text for XINPUT connectivity on Android
    - android_ds4: text for DS4 connectivity on Android
    - android_ns: text for NS connectivity on Android
    - ios_hid: text for HID connectivity on iOS
    - ios_xinput: text for XINPUT connectivity on iOS
    - ios_ds4: text for DS4 connectivity on iOS
    - ios_ns: text for NS connectivity on iOS

  3. Security
    - Maintain existing RLS policies
*/

-- Add new testing platform fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'android_tested'
  ) THEN
    ALTER TABLE games ADD COLUMN android_tested boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'ios_tested'
  ) THEN
    ALTER TABLE games ADD COLUMN ios_tested boolean DEFAULT false;
  END IF;
END $$;

-- Add Android protocol connectivity fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'android_hid'
  ) THEN
    ALTER TABLE games ADD COLUMN android_hid text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'android_xinput'
  ) THEN
    ALTER TABLE games ADD COLUMN android_xinput text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'android_ds4'
  ) THEN
    ALTER TABLE games ADD COLUMN android_ds4 text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'android_ns'
  ) THEN
    ALTER TABLE games ADD COLUMN android_ns text;
  END IF;
END $$;

-- Add iOS protocol connectivity fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'ios_hid'
  ) THEN
    ALTER TABLE games ADD COLUMN ios_hid text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'ios_xinput'
  ) THEN
    ALTER TABLE games ADD COLUMN ios_xinput text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'ios_ds4'
  ) THEN
    ALTER TABLE games ADD COLUMN ios_ds4 text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'ios_ns'
  ) THEN
    ALTER TABLE games ADD COLUMN ios_ns text;
  END IF;
END $$;