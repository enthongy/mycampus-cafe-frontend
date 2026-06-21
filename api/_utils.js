// api/_utils.js
const crypto = require('crypto');

let cachedCookie = null;
let cookieExpiry = 0;

function solveChallenge(html) {
    // Method 1: Exact var a=..., b=..., c=...
    let match = html.match(/var\s+a\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*b\s*=\s*toNumbers\("([a-f0-9]+)"\)\s*,\s*c\s*=\s*toNumbers\("([a-f0-9]+)"\)/i);
    if (match) {
        return { key: match[1], iv: match[2], cipher: match[3] };
    }

    // Method 2: Find all toNumbers("...") and take the first three
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

    // Try with PKCS7 padding (Node.js default)
    try {
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return decrypted.toString('hex');
    } catch (err) {
        // If padding fails, try without padding (assume plaintext is multiple of block size)
        try {
            const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
            decipher.setAutoPadding(false);
            let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            // The result should be a hex string; validate it
            const result = decrypted.toString('hex');
            if (/^[a-f0-9]+$/.test(result)) {
                return result;
            }
            return null;
        } catch (err2) {
            // If both fail, log and return null
            console.error('Both padding attempts failed:', err2.message);
            return null;
        }
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
                // Decryption failed – return a snippet of the HTML for debugging
                throw new Error('Decryption failed. HTML snippet: ' + html.substring(0, 500));
            }
        } else {
            throw new Error('Could not extract hex strings. HTML snippet: ' + html.substring(0, 500));
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
