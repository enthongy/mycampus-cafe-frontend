// api/menu/[id].js
const { fetchWithCookie } = require('../_utils');

// --- ADD THIS CONFIGURATION ---
export const config = {
    api: {
        bodyParser: false, // Keep this if you're handling raw bodies, otherwise true
    },
};

// --- MODIFY YOUR HANDLER ---
export default async function handler(req, res) {
    // --- ADD THIS METHOD CHECK ---
    // Only allow DELETE and PUT methods
    if (req.method !== 'DELETE' && req.method !== 'PUT') {
        res.setHeader('Allow', ['DELETE', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // --- YOUR EXISTING LOGIC ---
    const { id } = req.query;
    const apiUrl = `https://mycampus-cafe-api.infinityfreeapp.com/api/menu/${id}`;

    try {
        // ... rest of your existing code
        // Make sure to use req.method in your fetch options
        const response = await fetchWithCookie(apiUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers.authorization && { Authorization: req.headers.authorization }),
            },
            // ... body handling for PUT
        });
        // ... rest of your response handling
    } catch (error) {
        // ... error handling
    }
}
