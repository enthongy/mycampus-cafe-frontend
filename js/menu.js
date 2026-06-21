// api/menu.js
export default async function handler(req, res) {
    try {
        const response = await fetch('https://mycampus-cafe-api.infinityfreeapp.com/api/menu', {
            method: req.method,
            headers: req.headers,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Proxy error: ' + error.message });
    }
}
