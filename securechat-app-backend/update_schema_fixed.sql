-- Remove private keys from user_keys table (they should never be stored server-side)
ALTER TABLE user_keys DROP COLUMN IF EXISTS kyber_private_key;
ALTER TABLE user_keys DROP COLUMN IF EXISTS mldsa_private_key;

-- Update messages table to store only encrypted blobs
ALTER TABLE messages DROP COLUMN IF EXISTS encrypted_content;
ALTER TABLE messages DROP COLUMN IF EXISTS mldsa_signature;

-- Add new secure message columns (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='encrypted_blob') THEN
        ALTER TABLE messages ADD COLUMN encrypted_blob TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='signature') THEN
        ALTER TABLE messages ADD COLUMN signature TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='sender_public_key') THEN
        ALTER TABLE messages ADD COLUMN sender_public_key TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Update existing messages (temporary)
UPDATE messages SET encrypted_blob = 'legacy_encrypted_data' WHERE encrypted_blob = '';
UPDATE messages SET signature = 'legacy_signature' WHERE signature = '';
UPDATE messages SET sender_public_key = 'legacy_key' WHERE sender_public_key = '';