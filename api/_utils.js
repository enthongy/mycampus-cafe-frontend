// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

function solveChallenge(html) {
    // Method 1: Look for the exact var a=toNumbers("..."), b=..., c=...
    let match = html.match(/var\s+a\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*b\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*c\s*=\s*toNumbers\("([a-f0-9]+)"\)/i);
    if (match) {
        return { key: match[1], iv: match[2], cipher: match[3] };
    }

    // Method 2: Fallback – find all toNumbers("...") and take the first three
    const hexMatches = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
    if (hexMatches.length < 3) {
        console.error('Found only', hexMatches.length, 'hex strings');
        return null;
    }
    return {
        key: hexMatches[0][1],
        iv: hexMatches[1][1],
        cipher: hexMatches[2][1]
    };
}

function decryptCookie(hexStrings) {
    if (!hexStrings) return null;

    const key = Buffer.from(hexStrings.key, 'hex');
    const iv = Buffer.from(hexStrings.iv, 'hex');
    const ciphertext = Buffer.from(hexStrings.cipher, 'hex');

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
    // Use cached cookie if valid
    if (cachedCookie && Date.now() < cookieExpiry) {
        options.headers = options.headers || {};
        options.headers['Cookie'] = `__test=${cachedCookie}`;
    }

    let response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    // If the response is HTML (challenge page)
    if (contentType.includes('text/html')) {
        const html = await response.text();
        const hexStrings = solveChallenge(html);
        if (hexStrings) {
            const cookieValue = decryptCookie(hexStrings);
            if (cookieValue) {
                cachedCookie = cookieValue;
                cookieExpiry = Date.now() + 6 * 60 * 60 * 1000; // 6 hours
                options.headers = options.headers || {};
                options.headers['Cookie'] = `__test=${cookieValue}`;
                response = await fetch(url, options);
            } else {
                throw new Error('Decryption failed. Raw HTML: ' + html.substring(0, 300));
            }
        } else {
            // If extraction fails, return the first 500 chars of HTML for debugging
            throw new Error('Could not extract hex strings. HTML snippet: ' + html.substring(0, 500));
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
