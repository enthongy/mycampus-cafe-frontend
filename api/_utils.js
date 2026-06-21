// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

function solveChallenge(html) {
    // Method 1: Try to find the three hex strings directly
    // Look for patterns like: a=toNumbers("hex"), b=toNumbers("hex"), c=toNumbers("hex")
    let match = html.match(/a\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*b\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*c\s*=\s*toNumbers\("([a-f0-9]+)"\)/i);
    
    // Method 2: If that fails, find ALL toNumbers("hex") calls and take the first three
    if (!match) {
        const hexMatches = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
        if (hexMatches.length < 3) {
            console.error('Found only', hexMatches.length, 'hex strings');
            return null;
        }
        const keyHex = hexMatches[0][1];
        const ivHex = hexMatches[1][1];
        const cipherHex = hexMatches[2][1];
        
        return decryptCookie(keyHex, ivHex, cipherHex);
    }
    
    return decryptCookie(match[1], match[2], match[3]);
}

function decryptCookie(keyHex, ivHex, cipherHex) {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    try {
        // AES-128-CBC with PKCS7 padding (Node.js default)
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return decrypted.toString('hex');
    } catch (err) {
        console.error('Decryption error:', err.message);
        return null;
    }
}

async function fetchWithCookie(url, options = {}) {
    if (cachedCookie && Date.now() < cookieExpiry) {
        options.headers = options.headers || {};
        options.headers['Cookie'] = `__test=${cachedCookie}`;
    }

    let response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
        const html = await response.text();
        const cookieValue = solveChallenge(html);
        if (cookieValue) {
            cachedCookie = cookieValue;
            cookieExpiry = Date.now() + 6 * 60 * 60 * 1000; // 6 hours
            options.headers = options.headers || {};
            options.headers['Cookie'] = `__test=${cookieValue}`;
            response = await fetch(url, options);
        } else {
            // If we can't solve, return a more helpful error
            throw new Error('Failed to solve challenge. Unable to extract hex strings from HTML.');
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
