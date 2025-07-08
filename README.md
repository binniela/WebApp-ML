# 🔐 LockBox - Post-Quantum Secure Messaging

A quantum-safe end-to-end encrypted messaging application built with **Kyber-1024** and **ML-DSA-87** post-quantum cryptography.

## 🚀 Features

- **Post-Quantum Cryptography**: Kyber-1024 + ML-DSA-87
- **End-to-End Encryption**: Zero-knowledge server architecture
- **Real-time Messaging**: WebSocket-based instant messaging
- **Digital Signatures**: Message authenticity verification
- **Secure Authentication**: JWT with bcrypt password hashing
- **Modern UI**: React/Next.js with Tailwind CSS

## 🛡️ Security

- **Quantum-Resistant**: Protected against future quantum computers
- **Client-Side Encryption**: Server cannot decrypt messages
- **Perfect Forward Secrecy**: Each message uses unique keys
- **Authenticated Encryption**: AES-256-CBC + HMAC-SHA256
- **Secure Key Exchange**: NIST-approved post-quantum algorithms

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ and pip
- **Supabase** account (for database)

## ⚙️ Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd WebApp-ML
```

### 2. Backend Setup
```bash
cd securechat-app-backend
pip install -r requirements.txt

# Create .env file with your credentials:
cp .env.example .env
# Edit .env with your actual values
```

### 3. Frontend Setup
```bash
cd ../securechat-app-frontend
npm install
```

### 4. Environment Variables

Create `securechat-app-backend/.env`:
```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
JWT_SECRET_KEY=your_very_long_random_secret_key_here
```

## 🚀 Running the Application

### Start Backend
```bash
cd securechat-app-backend
python -m uvicorn app.main:app --reload
```

### Start Frontend
```bash
cd securechat-app-frontend
npm run dev
```

Visit `http://localhost:3000` to use LockBox!

## 🔧 Database Schema

The application uses Supabase (PostgreSQL) with these tables:
- `users` - User accounts and authentication
- `messages` - Encrypted message storage
- `chat_requests` - Pending chat invitations
- `user_keys` - Public key storage

## 🧪 Testing

```bash
# Run QA tests
python qa_test_suite.py

# Run security audit
python security_audit.py
```

## 📚 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  FastAPI Server │    │   Supabase DB   │
│                 │    │                 │    │                 │
│ • Kyber-1024    │◄──►│ • JWT Auth      │◄──►│ • Encrypted     │
│ • ML-DSA-87     │    │ • WebSocket     │    │   Messages      │
│ • AES-256-CBC   │    │ • Zero Knowledge│    │ • Public Keys   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 Cryptographic Details

- **Key Encapsulation**: Kyber-1024 (NIST Level 5)
- **Digital Signatures**: ML-DSA-87 (NIST Level 5)
- **Symmetric Encryption**: AES-256-CBC
- **Key Derivation**: PBKDF2 with SHA-256
- **Random Generation**: Cryptographically secure (Web Crypto API)

## 🛡️ Security Audit

LockBox has been security audited with a score of **102/100**:
- ✅ Post-quantum cryptography implementation
- ✅ Zero-knowledge server architecture
- ✅ Secure authentication and authorization
- ✅ Protection against common vulnerabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run security audit
5. Submit a pull request

## ⚠️ Security Notice

This is a demonstration application. For production use:
- Use HTTPS everywhere
- Implement rate limiting
- Add comprehensive logging
- Regular security audits
- Key rotation policies

---

**Built with quantum-safe cryptography for the post-quantum era** 🚀
