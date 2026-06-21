// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

/**
 * Solve the InfinityFree anti-bot challenge.
 * Extracts the three hex strings from the HTML and decrypts using AES-256-CBC.
 * Returns the __test cookie value (hex string) or null if not found.
 */
function solveInfinityFreeChallenge(html) {
    // Look for the three toNumbers() calls in the script
    const match = html.match(/toNumbers\("([a-f0-9]+)"\).*toNumbers\("([a-f0-9]+)"\).*toNumbers\("([a-f0-9]+)"\)/s);
    if (!match) return null;

    const key = Buffer.from(match[1], 'hex');   // a
    const iv = Buffer.from(match[2], 'hex');    // b
    const ciphertext = Buffer.from(match[3], 'hex'); // c

    // Decrypt using AES-256-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    // Convert decrypted bytes to hex (as the original script does with toHex())
    return decrypted.toString('hex');
}

/**
 * Fetch a URL with automatic handling of the anti-bot challenge.
 * If the response is HTML (challenge), it solves it, sets the cookie, and retries.
 */
async function fetchWithCookie(url, options = {}) {
    // Add cached cookie if valid
    if (cachedCookie && Date.now() < cookieExpiry) {
        options.headers = options.headers || {};
        options.headers['Cookie'] = `__test=${cachedCookie}`;
    }

    let response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    // If the response is HTML (likely the challenge page)
    if (contentType.includes('text/html')) {
        const html = await response.text();
        const cookieValue = solveInfinityFreeChallenge(html);
        if (cookieValue) {
            // Cache the cookie for 6 hours (matching InfinityFree's max-age)
            cachedCookie = cookieValue;
            cookieExpiry = Date.now() + 6 * 60 * 60 * 1000;

            // Retry the request with the cookie
            options.headers = options.headers || {};
            options.headers['Cookie'] = `__test=${cookieValue}`;
            response = await fetch(url, options);
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
