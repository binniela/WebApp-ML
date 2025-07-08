#!/bin/bash

# === LockBox Post-Quantum Crypto Setup ===
# Install liboqs with Kyber-1024 and ML-DSA-87 support

echo "🔐 Installing liboqs for LockBox post-quantum cryptography..."

# === 1. Install dependencies ===
echo "📦 Installing dependencies..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install Homebrew first."
        exit 1
    fi
    brew install cmake python git
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Ubuntu/Debian
    sudo apt-get update && sudo apt-get install -y cmake build-essential python3 python3-pip git
else
    echo "❌ Unsupported OS. Please install cmake, python, and git manually."
    exit 1
fi

# === 2. Clone and build liboqs ===
echo "🔧 Building liboqs from source..."

cd /tmp
rm -rf liboqs liboqs-python

git clone --recursive https://github.com/open-quantum-safe/liboqs.git
cd liboqs
mkdir build && cd build

# Configure with Kyber and ML-DSA enabled
cmake -DCMAKE_INSTALL_PREFIX=../install \
      -DOQS_ENABLE_KEM_kyber=ON \
      -DOQS_ENABLE_SIG_ml_dsa=ON \
      -DOQS_BUILD_ONLY_LIB=ON \
      ..

make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
make install
cd ../..

# === 3. Install liboqs-python ===
echo "🐍 Installing Python bindings..."

git clone https://github.com/open-quantum-safe/liboqs-python.git
cd liboqs-python

# Set liboqs path
export OQS_DIST_DIR=../liboqs/install

# Install Python bindings
pip3 install .

# === 4. Test installation ===
echo "🧪 Testing liboqs installation..."

python3 -c "
import oqs
import sys

print('✅ liboqs Python bindings installed successfully!')
print('📋 Supported KEMs:', [k for k in oqs.get_enabled_KEM_mechanisms() if 'Kyber' in k or 'ML-KEM' in k])
print('📋 Supported Signatures:', [s for s in oqs.get_enabled_sig_mechanisms() if 'ML-DSA' in s or 'Dilithium' in s])

# Test Kyber-1024
try:
    with oqs.KeyEncapsulation('Kyber1024') as alice:
        alice_pubkey = alice.generate_keypair()
        with oqs.KeyEncapsulation('Kyber1024') as bob:
            ciphertext, bob_shared = bob.encap_secret(alice_pubkey)
        alice_shared = alice.decap_secret(ciphertext)
    
    print('✅ Kyber-1024 KEM test:', 'PASSED' if alice_shared == bob_shared else 'FAILED')
except Exception as e:
    print('❌ Kyber-1024 test failed:', str(e))

# Test ML-DSA-87
try:
    with oqs.Signature('ML-DSA-87') as signer:
        pubkey = signer.generate_keypair()
        msg = b'LockBox post-quantum test message'
        sig = signer.sign(msg)
        valid = signer.verify(msg, sig, pubkey)
    
    print('✅ ML-DSA-87 signature test:', 'PASSED' if valid else 'FAILED')
except Exception as e:
    print('❌ ML-DSA-87 test failed:', str(e))

print('🚀 LockBox is ready for post-quantum cryptography!')
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! liboqs installed and tested successfully."
    echo ""
    echo "📝 Next steps:"
    echo "1. cd /Users/vincentla/Desktop/WebApp-ML/securechat-app-backend"
    echo "2. pip3 install -r requirements.txt"
    echo "3. python3 -m uvicorn app.main:app --reload"
    echo ""
    echo "🔐 Your LockBox now has REAL post-quantum cryptography!"
else
    echo "❌ Installation failed. Check the error messages above."
    exit 1
fi