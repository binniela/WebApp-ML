-- Chat requests table
CREATE TABLE IF NOT EXISTS chat_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (optional - for tracking active conversations)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    participant2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_requests_to_user ON chat_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_from_user ON chat_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_status ON chat_requests(status);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id);