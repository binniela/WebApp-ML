-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User keys table (only public keys stored)
CREATE TABLE IF NOT EXISTS user_keys (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    kyber_public_key TEXT NOT NULL,
    mldsa_public_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Messages table (stores encrypted blobs)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    encrypted_blob TEXT NOT NULL,
    signature TEXT NOT NULL,
    sender_public_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat requests table
CREATE TABLE IF NOT EXISTS chat_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_requests_to_user ON chat_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_from_user ON chat_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_status ON chat_requests(status);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Public read access for usernames (for search)
CREATE POLICY "Public username read" ON users FOR SELECT USING (true);

-- User keys policies
CREATE POLICY "Users can manage own keys" ON user_keys FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Public key read" ON user_keys FOR SELECT USING (true);

-- Messages policies
CREATE POLICY "Users can read own messages" ON messages FOR SELECT USING (
    auth.uid()::text = sender_id::text OR auth.uid()::text = recipient_id::text
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id::text
);

-- Chat requests policies
CREATE POLICY "Users can read own requests" ON chat_requests FOR SELECT USING (
    auth.uid()::text = from_user_id::text OR auth.uid()::text = to_user_id::text
);
CREATE POLICY "Users can send requests" ON chat_requests FOR INSERT WITH CHECK (
    auth.uid()::text = from_user_id::text
);
CREATE POLICY "Users can update received requests" ON chat_requests FOR UPDATE USING (
    auth.uid()::text = to_user_id::text
);