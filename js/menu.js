// file: /api/[...path].js
export default async function handler(req, res) {
  const { path } = req.query;
  const apiUrl = `https://mycampus-cafe-api.infinityfreeapp.com/api/${path.join('/')}`;

  try {
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' });
  }
}
