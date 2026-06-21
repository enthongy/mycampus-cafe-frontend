// api/menu.js
export default async function handler(req, res) {
    const apiUrl = 'https://mycampus-cafe-api.infinityfreeapp.com/api/menu';

    try {
        const authHeader = req.headers.authorization || req.headers['Authorization'] || '';

        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,   // <- forward token
            },
        };

        if (req.method === 'POST' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(apiUrl, fetchOptions);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Proxy error: ' + error.message });
    }
}
