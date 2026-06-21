// api/_utils.js
const crypto = require('crypto');

async function fetchWithCookie(url, options = {}) {
    // Clone headers to avoid mutation
    const headers = { ...(options.headers || {}) };
    
    // Make a copy of the original options
    const originalOptions = {
        method: options.method || 'GET',
        headers: headers,
        body: options.body || undefined,
    };

    // First attempt
    let response = await fetch(url, originalOptions);
    const contentType = response.headers.get('content-type') || '';

    // If we get HTML (challenge), solve it
    if (contentType.includes('text/html')) {
        const html = await response.text();
        const hexMatches = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
        
        if (hexMatches.length < 3) {
            throw new Error('Could not extract hex strings: ' + html.substring(0, 300));
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
            const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
            decipher.setAutoPadding(false);
            let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            const pad = decrypted[decrypted.length - 1];
            if (pad > 0 && pad <= 16) {
                decrypted = decrypted.subarray(0, decrypted.length - pad);
            }
            cookieValue = decrypted.toString('hex');
        }

        // IMPORTANT: Preserve ALL original headers (especially Authorization)
        const retryHeaders = { ...headers };
        retryHeaders['Cookie'] = `__test=${cookieValue}`;

        // Retry with the cookie
        response = await fetch(url, {
            method: options.method || 'GET',
            headers: retryHeaders,
            body: options.body || undefined,
        });
    }

    return response;
}

module.exports = { fetchWithCookie };
