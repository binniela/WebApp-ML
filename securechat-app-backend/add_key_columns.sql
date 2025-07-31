-- Add public key columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kyber_public_key TEXT,
ADD COLUMN IF NOT EXISTS mldsa_public_key TEXT;

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_users_keys ON users(id, kyber_public_key, mldsa_public_key);