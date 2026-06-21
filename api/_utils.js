// api/_utils.js
const { processChallenge } = require('@samuraitruong/php-cookie-challenge');

let cachedCookie = null;
let cookieExpiry = 0;

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

        try {
            // Process the challenge
            const result = processChallenge(html, {
                url: url,
                method: options.method || 'GET',
                headers: options.headers || {}
            });

            if (result.cookie) {
                cachedCookie = result.cookie;
                cookieExpiry = Date.now() + 6 * 60 * 60 * 1000; // 6 hours
                options.headers = options.headers || {};
                options.headers['Cookie'] = `__test=${result.cookie}`;
                // Retry the request with the cookie
                response = await fetch(result.url || url, options);
            } else {
                throw new Error('Challenge solver did not return a cookie');
            }
        } catch (err) {
            // If the package fails, fall back to returning the HTML (for debugging)
            throw new Error('Failed to solve challenge: ' + err.message);
        }
    }

    return response;
}

module.exports = { fetchWithCookie };
