// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

function solveInfinityFreeChallenge(html) {
    const match = html.match(/toNumbers\("([a-f0-9]+)"\).*toNumbers\("([a-f0-9]+)"\).*toNumbers\("([a-f0-9]+)"\)/s);
    if (!match) return null;

    const key = Buffer.from(match[1], 'hex');   // 16 bytes (AES-128)
    const iv = Buffer.from(match[2], 'hex');    // 16 bytes
    const ciphertext = Buffer.from(match[3], 'hex');

    // Use AES-128-CBC (not AES-256-CBC)
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return decrypted.toString('hex');
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
        const cookieValue = solveInfinityFreeChallenge(html);
        if (cookieValue) {
            cachedCookie = cookieValue;
            cookieExpiry = Date.now() + 6 * 60 * 60 * 1000;
            options.headers = options.headers || {};
            options.headers['Cookie'] = `__test=${cookieValue}`;
            response = await fetch(url, options);
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
