// api/_utils.js
const nodeGetReq = require('node-get-req');

let cachedCookie = null;
let cookieExpiry = 0;

async function fetchWithCookie(url, options = {}) {
    // Use cached cookie if valid
    if (cachedCookie && Date.now() < cookieExpiry) {
        options.headers = options.headers || {};
        options.headers['Cookie'] = `__test=${cachedCookie}`;
    }

    try {
        const response = await nodeGetReq({
            url: url,
            method: options.method || 'GET',
            headers: options.headers || {},
            data: options.body ? JSON.parse(options.body) : undefined,
        });

        // Store the cookie for future requests
        if (response.headers && response.headers['set-cookie']) {
            const cookieMatch = response.headers['set-cookie'].match(/__test=([^;]+)/);
            if (cookieMatch) {
                cachedCookie = cookieMatch[1];
                cookieExpiry = Date.now() + 6 * 60 * 60 * 1000; // 6 hours
            }
        }

        // Return a fetch-like response object
        return {
            ok: response.status < 400,
            status: response.status,
            headers: {
                get: (key) => response.headers[key.toLowerCase()]
            },
            json: async () => response.data,
            text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        };
    } catch (error) {
        throw new Error('Proxy error: ' + error.message);
    }
}

module.exports = { fetchWithCookie };