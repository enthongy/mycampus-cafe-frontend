// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

/**
 * Solve InfinityFree anti-bot challenge.
 * Extracts the three hex strings from the 'var a=toNumbers("..."), b=..., c=...' pattern.
 */
function solveInfinityFreeChallenge(html) {
    // Match: var a=toNumbers("hex1"), b=toNumbers("hex2"), c=toNumbers("hex3");
    const match = html.match(/var\s+a\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*b\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*c\s*=\s*toNumbers\("([a-f0-9]+)"\)/i);
    if (!match) {
        console.error('Could not find challenge variables');
        return null;
    }

    const keyHex = match[1];   // a (key)
    const ivHex = match[2];    // b (IV)
    const cipherHex = match[3]; // c (ciphertext)

    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    try {
        // Use AES-128-CBC (since the key is 16 bytes = 128 bits)
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        // The decrypted bytes are the __test cookie value (in hex)
        return decrypted.toString('hex');
    } catch (err) {
        console.error('Decryption error:', err.message);
        return null;
    }
}

async function fetchWithCookie(url, options = {}) {
    // Add cached cookie if valid
    if (cachedCookie && Date.now() < cookieExpiry) {
        options.headers = options.headers || {};
        options.headers['Cookie'] = `__test=${cachedCookie}`;
    }

    let response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    // If the response is HTML (challenge page)
    if (contentType.includes('text/html')) {
        const html = await response.text();
        const cookieValue = solveInfinityFreeChallenge(html);
        if (cookieValue) {
            cachedCookie = cookieValue;
            cookieExpiry = Date.now() + 6 * 60 * 60 * 1000; // 6 hours
            options.headers = options.headers || {};
            options.headers['Cookie'] = `__test=${cookieValue}`;
            // Retry the request with the cookie
            response = await fetch(url, options);
        } else {
            // If we couldn't solve, throw an error with a snippet for debugging
            throw new Error('Failed to solve challenge. Response started with: ' + html.substring(0, 200));
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
