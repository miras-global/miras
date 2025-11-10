import { encrypt, decrypt } from 'eciesjs';
import { ethers } from 'ethers';

// Text encoder/decoder singletons
const te = new TextEncoder();
const td = new TextDecoder();

// --- Normalization helpers ---
export function strip0x(hex: any): string {
  // Accept strings or BytesLike; coerce to lowercase hex string
  let s: string;
  if (typeof hex === 'string') {
    s = hex;
  } else {
    try {
      s = ethers.utils.hexlify(hex);
    } catch {
      s = String(hex || '');
    }
  }
  return s.startsWith('0x') ? s.slice(2) : s;
}

export function ensure0x(hex: string): string {
  return hex?.startsWith('0x') ? hex : `0x${hex}`;
}

/**
 * Accepts 0x.. private key (32 bytes) and returns lowercase hex WITH 0x.
 */
export function normalizePrivateKeyHex(priv: string): string {
  const h = strip0x(String(priv)).toLowerCase();
  if (h.length !== 64) throw new Error('Invalid private key length (expected 32 bytes / 64 hex chars)');
  if (!/^[0-9a-f]+$/.test(h)) throw new Error('Invalid private key hex');
  return `0x${h}`;
}

/**
 * Accepts uncompressed 0x04... public key (65 bytes) and returns lowercase hex WITH 0x.
 */
export function normalizeUncompressedPublicKeyHex(pub: string | Uint8Array): string {
  const h = strip0x(pub as any).toLowerCase();
  if (h.length !== 130 || !h.startsWith('04')) {
    throw new Error('Public key must be uncompressed (0x04 + 64 bytes)');
  }
  if (!/^[0-9a-f]+$/.test(h)) throw new Error('Invalid public key hex');
  return `0x${h}`;
}

// --- Validation helpers (boolean) ---
export function isValidPrivateKeyHex(priv: string): boolean {
  try { normalizePrivateKeyHex(priv); return true; } catch { return false; }
}

export function isValidUncompressedPublicKeyHex(pub: string): boolean {
  try { normalizeUncompressedPublicKeyHex(pub); return true; } catch { return false; }
}

// --- Base64 helpers ---
export function bytesToBase64(b: Uint8Array): string {
  if (typeof window !== 'undefined' && 'btoa' in window) {
    let binary = '';
    b.forEach((x) => binary += String.fromCharCode(x));
    return btoa(binary);
  }
  // Node fallback
  // eslint-disable-next-line no-undef
  return Buffer.from(b).toString('base64');
}

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof window !== 'undefined' && 'atob' in window) {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  // Node fallback
  // eslint-disable-next-line no-undef
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

// --- ECIES (secp256k1) encrypt/decrypt ---

/**
 * Encrypt bytes with an uncompressed public key (0x04...)
 * Returns ciphertext bytes suitable for storage/transport.
 */
export function encryptToBytes(publicKeyUncompressedHex: string | Uint8Array, data: Uint8Array): Uint8Array {
  // Accept string or Uint8Array; convert to hex without external helpers
  function bytesToHex(u8: Uint8Array): string {
    const hex: string[] = new Array(u8.length);
    for (let i = 0; i < u8.length; i++) {
      hex[i] = u8[i].toString(16).padStart(2, '0');
    }
    return '0x' + hex.join('');
  }

  function hexToBytes(h: string): Uint8Array {
        if (h.length % 2 !== 0) throw new Error('Invalid hex length');
        const out = new Uint8Array(h.length / 2);
        for (let i = 0; i < h.length; i += 2) {
          out[i / 2] = parseInt(h.substr(i, 2), 16);
        }
        return out;
      }

  const keyHex = typeof publicKeyUncompressedHex === 'string'
    ? publicKeyUncompressedHex
    : bytesToHex(publicKeyUncompressedHex);

  // Normalize: strip 0x and lowercase; support both uncompressed (0x04...) and compressed (0x02/0x03...)
  const pubHex = (keyHex.startsWith('0x') ? keyHex.slice(2) : keyHex).toLowerCase();
  //const pub = PublicKey.fromHex(pubHex);
  //return encrypt(pub, data);
  const keyBytes = hexToBytes(pubHex);
  return encrypt(keyBytes, data);
}

/**
 * Encrypt a string or bytes and return base64 ciphertext.
 */
export function encryptToBase64(publicKeyUncompressedHex: string | Uint8Array, msg: string | Uint8Array): string {
  // Inline UTF-8 encoder (no external dependency)
  function utf8Encode(str: string): Uint8Array {
    const codePoints: number[] = [];
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      if (code < 0x80) {
        codePoints.push(code);
      } else if (code < 0x800) {
        codePoints.push(0xc0 | (code >> 6));
        codePoints.push(0x80 | (code & 0x3f));
      } else if (code < 0xd800 || code >= 0xe000) {
        codePoints.push(0xe0 | (code >> 12));
        codePoints.push(0x80 | ((code >> 6) & 0x3f));
        codePoints.push(0x80 | (code & 0x3f));
      } else {
        // surrogate pair
        i++;
        const code2 = str.charCodeAt(i);
        const u = ((code & 0x3ff) << 10) | (code2 & 0x3ff);
        const cp = 0x10000 + u;
        codePoints.push(0xf0 | (cp >> 18));
        codePoints.push(0x80 | ((cp >> 12) & 0x3f));
        codePoints.push(0x80 | ((cp >> 6) & 0x3f));
        codePoints.push(0x80 | (cp & 0x3f));
      }
    }
    return new Uint8Array(codePoints);
  }

  // Inline base64 encoder (browser/node compatible)
  function toBase64(bytes: Uint8Array): string {
    if (typeof window !== 'undefined' && 'btoa' in window) {
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      // btoa expects binary string (Latin1)
      return btoa(bin);
    }
    // Node fallback
    // eslint-disable-next-line no-undef
    return Buffer.from(bytes).toString('base64');
  }

  const payload = typeof msg === 'string' ? utf8Encode(msg) : msg;
  const cipher = encryptToBytes(publicKeyUncompressedHex, payload);
  return toBase64(cipher);
}

/**
 * Decrypt bytes with a private key (0x...)
 * Returns plaintext bytes.
 */
export function decryptFromBytes(privateKeyHex: string, cipher: Uint8Array): Uint8Array {
  const privHex = strip0x(normalizePrivateKeyHex(privateKeyHex));
  //const priv = PrivateKey.fromHex(privHex);
  //return decrypt(priv, cipher);
  return decrypt(privHex, cipher);
}

/**
 * Decrypt a base64 ciphertext and return UTF-8 string.
 */
export function decryptFromBase64ToString(privateKeyHex: string, b64: string): string {
  const cipher = base64ToBytes(b64);
  const plain = decryptFromBytes(privateKeyHex, cipher);
  return td.decode(plain);
}

/**
 * Convenience helpers to encrypt/decrypt strings.
 */
export function encryptString(publicKeyUncompressedHex: string, message: string): string {
  return encryptToBase64(publicKeyUncompressedHex, message);
}

export function decryptString(privateKeyHex: string, b64Ciphertext: string): string {
  return decryptFromBase64ToString(privateKeyHex, b64Ciphertext);
}

// --- Example usage ---
// const b64 = encryptString(pubKey, 'hello');
// const msg = decryptString(privKey, b64);

/**
 * Expanded usage example

import { encryptString, decryptString } from '@/lib/crypto';

// Your saved keys from RegisterPage
const pub = keys?.pub;   // uncompressed 0x04...
const priv = keys?.priv; // 0x...

const cipherB64 = encryptString(pub!, 'miras attester');
const plain = decryptString(priv!, cipherB64);
console.log({ cipherB64, plain });

*/