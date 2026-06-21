// api/test-auth.js
const { fetchWithCookie } = require('./_utils');

export default async function handler(req, res) {
    try {
        const apiUrl = 'https://mycampus-cafe-api.infinityfreeapp.com/api/test-auth';
        const headers = {};
        const authHeader = req.headers.authorization || req.headers['Authorization'];
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }
        const response = await fetchWithCookie(apiUrl, { method: 'GET', headers });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
