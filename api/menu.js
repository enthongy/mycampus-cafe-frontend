// api/menu.js
const { solveInfinityFreeChallenge } = require('./solve-challenge');

let cachedCookie = null;
let cookieExpiry = 0;

async function fetchWithCookie(apiUrl, options) {
    // If we have a cached cookie, use it
    if (cachedCookie && Date.now() < cookieExpiry) {
        options.headers['Cookie'] = `__test=${cachedCookie}`;
    }

    let response = await fetch(apiUrl, options);

    // Check if response is HTML (anti-bot challenge)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
        const html = await response.text();
        const cookieValue = solveInfinityFreeChallenge(html);
        if (cookieValue) {
            // Cache the cookie for 6 hours (matching InfinityFree's max-age)
            cachedCookie = cookieValue;
            cookieExpiry = Date.now() + 6 * 60 * 60 * 1000;

            // Retry with the cookie
            options.headers['Cookie'] = `__test=${cookieValue}`;
            response = await fetch(apiUrl, options);
        }
    }

    return response;
}

export default async function handler(req, res) {
    const apiUrl = 'https://mycampus-cafe-api.infinityfreeapp.com/api/menu';

    try {
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers.authorization && { Authorization: req.headers.authorization }),
            },
        };

        if (req.method === 'POST' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetchWithCookie(apiUrl, fetchOptions);

        // Process response
        const contentType = response.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { error: 'Unexpected response', details: text };
        }

        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy error: ' + error.message });
    }
}
