// api/menu/[id].js
const { fetchWithCookie } = require('../_utils');

export default async function handler(req, res) {
    const { id } = req.query;
    const apiUrl = `https://mycampus-cafe-api.infinityfreeapp.com/api/menu/${id}`;

    // Allow only PUT and DELETE
    if (req.method !== 'PUT' && req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Extract Authorization header (case-insensitive)
        const authHeader = req.headers.authorization || req.headers['Authorization'] || '';

        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
        };

        // For PUT requests, include the body
        if (req.method === 'PUT' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        // Use the challenge-solver to fetch from InfinityFree
        const response = await fetchWithCookie(apiUrl, fetchOptions);

        // Process response
        const contentType = response.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { error: 'Unexpected response from backend', details: text };
        }

        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy menu/[id] error:', error);
        res.status(500).json({ error: 'Proxy error: ' + error.message });
    }
}
