// api/login.js
const { fetchWithCookie } = require('./_utils');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiUrl = 'https://mycampus-cafe-api.infinityfreeapp.com/api/login';
        const headers = { 'Content-Type': 'application/json' };
        const fetchOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req.body),
        };

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
        console.error('Proxy login error:', error);
        res.status(500).json({
            error: 'Proxy login error',
            message: error.message,
            stack: error.stack,
        });
    }
}
