// api/menu/[id].js
const { fetchWithCookie } = require('../_utils');

export default async function handler(req, res) {
    const { id } = req.query;
    const apiUrl = `https://mycampus-cafe-api.infinityfreeapp.com/api/menu/${id}`;

    if (req.method !== 'PUT' && req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const headers = {
            'Content-Type': 'application/json',
        };

        const authHeader = req.headers.authorization || req.headers['Authorization'];
        if (authHeader) {
            const token = authHeader.replace(/^Bearer\s+/i, '');
            headers['X-Auth-Token'] = token;
        }

        const fetchOptions = {
            method: req.method,
            headers: headers,
        };

        if (req.method === 'PUT' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetchWithCookie(apiUrl, fetchOptions);

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
        console.error('Proxy menu/[id] error:', error);
        res.status(500).json({
            error: 'Proxy error',
            message: error.message,
            stack: error.stack,
        });
    }
}
