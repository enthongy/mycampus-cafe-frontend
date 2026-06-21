// api/menu.js
const { fetchWithCookie } = require('./_utils');

export default async function handler(req, res) {
    const apiUrl = 'https://mycampus-cafe-api.infinityfreeapp.com/api/menu';

    try {
        const authHeader = req.headers.authorization || req.headers['Authorization'] || '';

        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
        };

        if (req.method === 'POST' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetchWithCookie(apiUrl, fetchOptions);

        // ... rest unchanged
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy error: ' + error.message });
    }
}
