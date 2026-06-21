// api/_utils.js
const axios = require('axios');
const { createAxiosClient } = require('@samuraitruong/php-cookie-challenge');

let cachedClient = null;

function getClient() {
    if (!cachedClient) {
        cachedClient = createAxiosClient({
            baseURL: 'https://mycampus-cafe-api.infinityfreeapp.com',
            timeout: 10000,
        });
    }
    return cachedClient;
}

async function fetchWithCookie(url, options = {}) {
    const client = getClient();
    
    try {
        const response = await client({
            url: url.replace('https://mycampus-cafe-api.infinityfreeapp.com', ''),
            method: options.method || 'GET',
            headers: options.headers || {},
            data: options.body ? JSON.parse(options.body) : undefined,
        });
        
        return {
            ok: response.status < 400,
            status: response.status,
            headers: { get: (key) => response.headers[key] },
            json: async () => response.data,
            text: async () => JSON.stringify(response.data),
        };
    } catch (error) {
        throw new Error('Proxy error: ' + error.message);
    }
}

module.exports = { fetchWithCookie };
