// api/menu.js
export default async function handler(req, res) {
    const apiUrl = 'https://mycampus-cafe-api.infinityfreeapp.com/api/menu';

    try {
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers.authorization && { Authorization: req.headers.authorization }),
            },
        };

        // Add body for POST requests
        if (req.method === 'POST' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(apiUrl, fetchOptions);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // If not JSON, return the raw text (useful for debugging)
            const text = await response.text();
            data = { error: 'Unexpected response from backend', details: text };
        }

        res.status(response.status).json(data);
    } catch (error) {
        // Log the error to Vercel logs
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Proxy error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
