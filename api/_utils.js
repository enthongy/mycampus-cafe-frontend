// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

function solveChallenge(html) {
    // Method 1: Look for var a=toNumbers("..."), b=..., c=...
    let match = html.match(/var\s+a\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*b\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*c\s*=\s*toNumbers\("([a-f0-9]+)"\)/i);
    if (match) {
        return { key: match[1], iv: match[2], cipher: match[3] };
    }

    // Method 2: Look for a=toNumbers("..."), b=..., c=... (without "var")
    match = html.match(/a\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*b\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*c\s*=\s*toNumbers\("([a-f0-9]+)"\)/i);
    if (match) {
        return { key: match[1], iv: match[2], cipher: match[3] };
    }

    // Method 3: Find all toNumbers("...") and take the first three
    const hexMatches = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
    if (hexMatches.length >= 3) {
        return {
            key: hexMatches[0][1],
            iv: hexMatches[1][1],
            cipher: hexMatches[2][1]
        };
    }

    // If all fail, log the first 500 chars for debugging
    console.error('Could not extract hex strings. HTML snippet:', html.substring(0, 500));
    return null;
}

function decryptCookie(hexStrings) {
    if (!hexStrings) return null;

    const key = Buffer.from(hexStrings.key, 'hex');
    const iv = Buffer.from(hexStrings.iv, 'hex');
    const ciphertext = Buffer.from(hexStrings.cipher, 'hex');

    // Try default PKCS7 padding
    try {
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return decrypted.toString('hex');
    } catch (_) {
        // Try without padding
        try {
            const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
            decipher.setAutoPadding(false);
            let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            // Remove padding if present (simple PKCS7 removal)
            const pad = decrypted[decrypted.length - 1];
            if (pad > 0 && pad <= 16) {
                decrypted = decrypted.subarray(0, decrypted.length - pad);
            }
            return decrypted.toString('hex');
        } catch (_) {
            return null;
        }
    }
}

async function fetchWithCookie(url, options = {}) {
    // Clone headers to avoid mutation
    const headers = { ...(options.headers || {}) };

    if (cachedCookie && Date.now() < cookieExpiry) {
        headers['Cookie'] = `__test=${cachedCookie}`;
    }

    let response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
        const html = await response.text();
        const hexStrings = solveChallenge(html);
        if (hexStrings) {
            const cookieValue = decryptCookie(hexStrings);
            if (cookieValue) {
                cachedCookie = cookieValue;
                cookieExpiry = Date.now() + 6 * 60 * 60 * 1000;
                headers['Cookie'] = `__test=${cookieValue}`;
                response = await fetch(url, { ...options, headers });
            } else {
                throw new Error('Decryption failed. HTML snippet: ' + html.substring(0, 500));
            }
        } else {
            throw new Error('Could not extract hex strings. HTML snippet: ' + html.substring(0, 500));
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
