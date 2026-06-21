// api/_utils.js
const crypto = require('crypto');

async function fetchWithCookie(url, options = {}) {
    // Ensure headers object exists
    const headers = { ...(options.headers || {}) };
    
    // First attempt without cookie
    let response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';

    // If the response is HTML (challenge page), solve it
    if (contentType.includes('text/html')) {
        const html = await response.text();
        const hexMatches = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
        if (hexMatches.length < 3) {
            throw new Error('Could not extract hex strings. Snippet: ' + html.substring(0, 300));
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
            try {
                const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
                decipher.setAutoPadding(false);
                let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
                const pad = decrypted[decrypted.length - 1];
                if (pad > 0 && pad <= 16) {
                    decrypted = decrypted.subarray(0, decrypted.length - pad);
                }
                cookieValue = decrypted.toString('hex');
            } catch (_) {
                throw new Error('Decryption failed. Snippet: ' + html.substring(0, 300));
            }
        }

        // IMPORTANT: Preserve ALL original headers
        const newHeaders = { ...headers };
        newHeaders['Cookie'] = `__test=${cookieValue}`;

        // Retry with the cookie
        response = await fetch(url, { ...options, headers: newHeaders });
    }

    return response;
}

module.exports = { fetchWithCookie };
