// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

function solveChallenge(html) {
    const hexMatches = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
    if (hexMatches.length < 3) return null;
    const key = Buffer.from(hexMatches[0][1], 'hex');
    const iv = Buffer.from(hexMatches[1][1], 'hex');
    const ciphertext = Buffer.from(hexMatches[2][1], 'hex');
    try {
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return decrypted.toString('hex');
    } catch (err) {
        return null;
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
        const cookieValue = solveChallenge(html);
        if (cookieValue) {
            cachedCookie = cookieValue;
            cookieExpiry = Date.now() + 6 * 60 * 60 * 1000;
            headers['Cookie'] = `__test=${cookieValue}`;
            response = await fetch(url, { ...options, headers });
        } else {
            throw new Error('Failed to solve challenge. Snippet: ' + html.substring(0, 300));
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
