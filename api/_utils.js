// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

function solveInfinityFreeChallenge(html) {
    const match = html.match(/toNumbers\("([a-f0-9]+)"\).*toNumbers\("([a-f0-9]+)"\).*toNumbers\("([a-f0-9]+)"\)/s);
    if (!match) return null;

    const key = Buffer.from(match[1], 'hex');
    const iv = Buffer.from(match[2], 'hex');
    const ciphertext = Buffer.from(match[3], 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('hex');
}

async function fetchWithCookie(apiUrl, options) {
    if (cachedCookie && Date.now() < cookieExpiry) {
        options.headers['Cookie'] = `__test=${cachedCookie}`;
    }

    let response = await fetch(apiUrl, options);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
        const html = await response.text();
        const cookieValue = solveInfinityFreeChallenge(html);
        if (cookieValue) {
            cachedCookie = cookieValue;
            cookieExpiry = Date.now() + 6 * 60 * 60 * 1000;
            options.headers['Cookie'] = `__test=${cookieValue}`;
            response = await fetch(apiUrl, options);
        }
    }
    return response;
}

module.exports = { fetchWithCookie };
