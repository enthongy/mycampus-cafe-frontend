// api/menu.js
const { fetchWithCookie } = require('./_utils');

export default async function handler(req, res) {
    try {
        const apiUrl = 'https://mycampus-cafe-api.infinityfreeapp.com/api/menu';

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
        // Return the error as JSON so you can see it in the browser
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Proxy error',
            message: error.message,
            stack: error.stack,
        });
    }
}
