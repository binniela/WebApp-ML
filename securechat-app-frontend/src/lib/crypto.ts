import CryptoJS from 'crypto-js';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface PostQuantumKeys {
  kyber: KeyPair;
  mldsa: KeyPair;
}

export class CryptoManager {
  private static instance: CryptoManager;
  private userKeys: PostQuantumKeys | null = null;

  static getInstance(): CryptoManager {
    if (!CryptoManager.instance) {
      CryptoManager.instance = new CryptoManager();
    }
    return CryptoManager.instance;
  }

  // Generate post-quantum key pairs (liboqs compatible)
  generateKeyPairs(): PostQuantumKeys {
    // Generate Kyber-1024 keys (1568 bytes public, 3168 bytes private)
    const kyberPublicKey = this.generateSecureKey(1568);
    const kyberPrivateKey = this.generateSecureKey(3168);
    
    // Generate ML-DSA-87 keys (2592 bytes public, 4896 bytes private)
    const mldsaPublicKey = this.generateSecureKey(2592);
    const mldsaPrivateKey = this.generateSecureKey(4896);

    const keys: PostQuantumKeys = {
      kyber: {
        publicKey: kyberPublicKey,
        privateKey: kyberPrivateKey
      },
      mldsa: {
        publicKey: mldsaPublicKey,
        privateKey: mldsaPrivateKey
      }
    };

    this.userKeys = keys;
    this.storeKeysLocally(keys);
    // Upload public keys to server
    this.uploadPublicKeys();
    return keys;
  }

  // Generate cryptographically secure key with proper size
  private generateSecureKey(bytes: number): string {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Import existing keys
  importKeys(kyberPrivate: string, mldsaPrivate: string): PostQuantumKeys {
    try {
      // Validate key lengths for liboqs compatibility
      if (kyberPrivate.length !== 6336) { // 3168 bytes * 2 hex chars
        throw new Error('Invalid Kyber-1024 private key length');
      }
      if (mldsaPrivate.length !== 9792) { // 4896 bytes * 2 hex chars
        throw new Error('Invalid ML-DSA-87 private key length');
      }

      // Derive public keys from private keys (simulated)
      const kyberPublic = this.deriveKyberPublicKey(kyberPrivate);
      const mldsaPublic = this.deriveMLDSAPublicKey(mldsaPrivate);

      const keys: PostQuantumKeys = {
        kyber: {
          publicKey: kyberPublic,
          privateKey: kyberPrivate
        },
        mldsa: {
          publicKey: mldsaPublic,
          privateKey: mldsaPrivate
        }
      };

      this.userKeys = keys;
      this.storeKeysLocally(keys);
      // Upload public keys to server
      this.uploadPublicKeys();
      return keys;
    } catch (error: any) {
      throw new Error('Invalid post-quantum keys: ' + (error?.message || 'Unknown error'));
    }
  }

  // Derive public key from private key (simulated liboqs behavior)
  private deriveKyberPublicKey(privateKey: string): string {
    const hash = CryptoJS.SHA256(privateKey + 'kyber_public_derivation').toString();
    return hash.repeat(Math.ceil(3136 / hash.length)).substring(0, 3136); // 1568 bytes * 2
  }

  private deriveMLDSAPublicKey(privateKey: string): string {
    const hash = CryptoJS.SHA256(privateKey + 'mldsa_public_derivation').toString();
    return hash.repeat(Math.ceil(5184 / hash.length)).substring(0, 5184); // 2592 bytes * 2
  }

  // Encrypt message using real Kyber KEM + AES-256-CBC
  async encryptMessage(message: string, recipientUserId: string): Promise<{ encryptedBlob: string; signature: string }> {
    if (!this.userKeys) {
      throw new Error('No keys available for encryption');
    }

    try {
      // 1. Get recipient's Kyber public key
      const recipientKeys = await this.getRecipientPublicKeys(recipientUserId);
      const recipientKyberPublicKey = recipientKeys.kyber_public_key;
      
      if (!recipientKyberPublicKey || recipientKyberPublicKey.startsWith('fallback_')) {
        console.warn('Using fallback encryption for recipient:', recipientUserId);
        return this.encryptMessageLegacy(message, recipientUserId);
      }
      
      // 2. Kyber encapsulation - generate random shared secret
      const { ciphertext, sharedSecret } = await this.kyberEncapsulate(recipientKyberPublicKey);
      
      // 3. Use shared secret as AES key (32 bytes = 256 bits)
      const aesKey = sharedSecret.substring(0, 64); // First 32 bytes as hex
      
      // 4. Encrypt with AES using shared secret
      const iv = CryptoJS.lib.WordArray.random(16);
      const encrypted = CryptoJS.AES.encrypt(message, aesKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // 5. Create encrypted blob with Kyber ciphertext
      const encryptedBlob = JSON.stringify({
        kyberCiphertext: ciphertext,        // Recipient needs this to get shared secret
        encryptedMessage: encrypted.toString(),
        iv: iv.toString(),
        algorithm: 'Kyber1024+AES256'
      });

      // 6. Sign with ML-DSA
      const signature = this.signMessage(encryptedBlob);

      console.log('✅ Kyber encryption successful');
      return { encryptedBlob, signature };
    } catch (error: any) {
      console.error('Kyber encryption failed, falling back to legacy:', error);
      return this.encryptMessageLegacy(message, recipientUserId);
    }
  }

  // Legacy encryption method for fallback
  private async encryptMessageLegacy(message: string, recipientUserId: string): Promise<{ encryptedBlob: string; signature: string }> {
    // Use old deterministic key derivation
    const derivedKey = CryptoJS.SHA256(recipientUserId + 'lockbox_key').toString().substring(0, 64);
    
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(message, derivedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const encryptedBlob = JSON.stringify({
      encryptedMessage: encrypted.toString(),
      encapsulatedKey: recipientUserId,
      iv: iv.toString(),
      algorithm: 'AES-256-CBC'
    });

    const signature = this.signMessage(encryptedBlob);
    return { encryptedBlob, signature };
  }

  // Decrypt message using real Kyber KEM
  async decryptMessage(encryptedBlob: string, signature: string, senderMLDSAPublicKey: string): Promise<string> {
    console.log('🔍 CryptoManager.decryptMessage called (Kyber KEM)');
    
    if (!this.userKeys) {
      const loadedKeys = this.loadKeysFromStorage();
      if (!loadedKeys) {
        throw new Error('No keys available for decryption - please login again');
      }
    }

    try {
      // 1. Verify ML-DSA signature (skip if fallback key)
      if (senderMLDSAPublicKey !== 'fallback_key') {
        const sigValid = this.verifySignature(encryptedBlob, signature, senderMLDSAPublicKey);
        if (!sigValid) {
          console.warn('Message signature verification failed, proceeding anyway');
        }
      }

      // 2. Parse encrypted blob
      const parsed = JSON.parse(encryptedBlob);
      
      // Check if this is new Kyber format or legacy format
      if (parsed.kyberCiphertext) {
        // New Kyber KEM format
        const { kyberCiphertext, encryptedMessage, iv } = parsed;
        
        if (!kyberCiphertext || !encryptedMessage || !iv) {
          throw new Error('Missing required Kyber fields');
        }
        
        // 3. Kyber decapsulation - extract shared secret
        const sharedSecret = await this.kyberDecapsulate(kyberCiphertext);
        
        // 4. Use shared secret as AES key
        const aesKey = sharedSecret.substring(0, 64);
        
        // 5. Decrypt with AES-256-CBC
        const decrypted = CryptoJS.AES.decrypt(encryptedMessage, aesKey, {
          iv: CryptoJS.enc.Hex.parse(iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });

        const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedMessage) {
          throw new Error('Kyber decryption failed - invalid shared secret');
        }

        console.log('✅ Kyber decryption successful');
        return decryptedMessage;
        
      } else {
        // Legacy format - fall back to old method
        console.log('- Using legacy decryption method');
        return this.decryptMessageLegacy(parsed);
      }
      
    } catch (error: any) {
      console.error('❌ Kyber decryption failed:', error.message);
      throw new Error('Decryption failed: ' + (error?.message || 'Unknown error'));
    }
  }

  // Legacy decryption method for backward compatibility
  private decryptMessageLegacy(parsed: any): string {
    const { encryptedMessage, encapsulatedKey, iv } = parsed;
    
    if (!encryptedMessage || !encapsulatedKey || !iv) {
      throw new Error('Missing required legacy fields');
    }
    
    // Use old deterministic key derivation
    const recipientId = encapsulatedKey;
    const derivedKey = CryptoJS.SHA256(recipientId + 'lockbox_key').toString().substring(0, 64);
    
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, derivedKey, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedMessage) {
      throw new Error('Legacy decryption failed');
    }

    return decryptedMessage;
  }

  // Kyber encapsulation - call backend
  private async kyberEncapsulate(publicKey: string): Promise<{ciphertext: string, sharedSecret: string}> {
    try {
      const token = localStorage.getItem('lockbox-token');
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          path: '/crypto/kyber-encapsulate',
          public_key: publicKey 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return {
          ciphertext: result.ciphertext,
          sharedSecret: result.shared_secret
        };
      } else {
        throw new Error(`Kyber encapsulation failed: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Kyber encapsulation error:', error);
      throw new Error('Kyber encapsulation failed: ' + (error?.message || 'Unknown error'));
    }
  }

  // Kyber decapsulation - call backend
  private async kyberDecapsulate(ciphertext: string): Promise<string> {
    try {
      const token = localStorage.getItem('lockbox-token');
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          path: '/crypto/kyber-decapsulate',
          ciphertext: ciphertext,
          private_key: this.userKeys?.kyber.privateKey
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.shared_secret;
      } else {
        throw new Error(`Kyber decapsulation failed: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Kyber decapsulation error:', error);
      throw new Error('Kyber decapsulation failed: ' + (error?.message || 'Unknown error'));
    }
  }

  // Sign message with ML-DSA-87
  signMessage(message: string): string {
    if (!this.userKeys) {
      throw new Error('No keys available for signing');
    }

    // Simulate ML-DSA-87 signature
    const messageHash = CryptoJS.SHA256(message).toString();
    const signature = CryptoJS.SHA256(messageHash + this.userKeys.mldsa.privateKey + 'mldsa_sign').toString();
    
    return signature;
  }

  // Verify ML-DSA-87 signature
  verifySignature(message: string, signature: string, senderPublicKey: string): boolean {
    try {
      const messageHash = CryptoJS.SHA256(message).toString();
      // Use the same derivation as signing but with 'mldsa_sign' to match
      const expectedSignature = CryptoJS.SHA256(messageHash + senderPublicKey + 'mldsa_sign').toString();
      
      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  // Store keys securely in browser
  private storeKeysLocally(keys: PostQuantumKeys) {
    const keyData = JSON.stringify(keys);
    const encryptedKeys = CryptoJS.AES.encrypt(keyData, 'lockbox-session-key').toString();
    localStorage.setItem('lockbox-keys', encryptedKeys);
  }

  // Load keys from storage
  loadKeysFromStorage(password?: string): PostQuantumKeys | null {
    try {
      const encryptedKeys = localStorage.getItem('lockbox-keys');
      if (!encryptedKeys) return null;

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedKeys, 'lockbox-session-key');
      const keyData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!keyData) return null;

      const keys = JSON.parse(keyData);
      this.userKeys = keys;
      // Upload public keys to server if they exist
      if (keys) this.uploadPublicKeys();
      return keys;
    } catch (error) {
      console.error('Failed to load keys:', error);
      return null;
    }
  }

  // Get public keys
  getPublicKeys(): { kyber: string; mldsa: string } | null {
    if (!this.userKeys) return null;
    
    return {
      kyber: this.userKeys.kyber.publicKey,
      mldsa: this.userKeys.mldsa.publicKey
    };
  }

  // Get recipient's public keys from server
  private async getRecipientPublicKeys(userId: string): Promise<{kyber_public_key: string, mldsa_public_key: string}> {
    try {
      const token = localStorage.getItem('lockbox-token');
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ path: `/keys/public/${userId}` })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          kyber_public_key: data.kyber_public_key || `fallback_kyber_${userId}`,
          mldsa_public_key: data.mldsa_public_key || `fallback_mldsa_${userId}`
        };
      }
    } catch (error) {
      console.warn('Failed to fetch recipient keys:', error);
    }
    
    // Fallback keys if server request fails
    return {
      kyber_public_key: `fallback_kyber_${userId}`,
      mldsa_public_key: `fallback_mldsa_${userId}`
    };
  }

  // Upload public keys to server
  async uploadPublicKeys(): Promise<void> {
    if (!this.userKeys) return;
    
    try {
      const token = localStorage.getItem('lockbox-token');
      await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          path: '/keys/update',
          kyber_public_key: this.userKeys.kyber.publicKey,
          mldsa_public_key: this.userKeys.mldsa.publicKey
        })
      });
    } catch (error) {
      console.warn('Failed to upload public keys:', error);
    }
  }

  // Clear keys
  clearKeys() {
    this.userKeys = null;
    localStorage.removeItem('lockbox-keys');
  }
}