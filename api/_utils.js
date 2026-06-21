// api/_utils.js
const crypto = require('crypto');

async function fetchWithCookie(url, options = {}) {
    // First attempt without cookie
    let response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    // If the response is HTML (challenge page), solve it
    if (contentType.includes('text/html')) {
        const html = await response.text();
        // Extract the three hex strings
        const hexMatches = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
        if (hexMatches.length < 3) {
            throw new Error('Could not extract hex strings. HTML snippet: ' + html.substring(0, 500));
        }
        const key = Buffer.from(hexMatches[0][1], 'hex');
        const iv = Buffer.from(hexMatches[1][1], 'hex');
        const ciphertext = Buffer.from(hexMatches[2][1], 'hex');

        let cookieValue;
        try {
            const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
            let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            cookieValue = decrypted.toString('hex');
        } catch (_) {
            // Try without padding
            try {
                const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
                decipher.setAutoPadding(false);
                let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
                // Remove PKCS7 padding
                const pad = decrypted[decrypted.length - 1];
                if (pad > 0 && pad <= 16) {
                    decrypted = decrypted.subarray(0, decrypted.length - pad);
                }
                cookieValue = decrypted.toString('hex');
            } catch (_) {
                throw new Error('Decryption failed. HTML snippet: ' + html.substring(0, 500));
            }
        }

        // Set the cookie and retry
        options.headers = options.headers || {};
        options.headers['Cookie'] = `__test=${cookieValue}`;
        response = await fetch(url, options);
    }

    return response;
}

module.exports = { fetchWithCookie };
