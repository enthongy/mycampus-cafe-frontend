// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

/**
 * Solve InfinityFree anti-bot challenge.
 * Extracts the three hex arguments from the slowAES.decrypt call.
 */
function solveInfinityFreeChallenge(html) {
    // Look for: slowAES.decrypt(toNumbers("..."), 2, toNumbers("..."), toNumbers("..."))
    const match = html.match(/slowAES\.decrypt\(\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*2\s*,\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*toNumbers\("([a-f0-9]+)"\)\s*\)/i);
    if (!match) {
        console.error('Could not find challenge script');
        return null;
    }

    const keyHex = match[1];
    const ivHex = match[2];
    const cipherHex = match[3];

    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    try {
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        // The result is the hex-encoded plaintext (the __test cookie value)
        return decrypted.toString('hex');
    } catch (err) {
        console.error('Decryption error:', err.message);
        return null;
    }
}

async function fetchWithCookie(url, options = {}) {
    // If we have a valid cached cookie, use it
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
            // If we couldn't solve, throw an error with the HTML snippet for debugging
            throw new Error('Failed to solve challenge. Response started with: ' + html.substring(0, 200));
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
