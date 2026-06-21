// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

function solveInfinityFreeChallenge(html) {
    // Find all hex strings inside toNumbers("...")
    const hexMatches = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
    if (hexMatches.length < 3) {
        console.error('Found only', hexMatches.length, 'hex strings');
        return null;
    }

    // The first three matches are a (key), b (IV), c (ciphertext)
    const keyHex = hexMatches[0][1];
    const ivHex = hexMatches[1][1];
    const cipherHex = hexMatches[2][1];

    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    try {
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
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
            throw new Error('Failed to solve challenge. Response snippet: ' + html.substring(0, 200));
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
