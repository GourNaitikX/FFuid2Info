const express = require('express'); // Fixed: Changed 'Const' to 'const'
const axios = require('axios');
const qs = require('qs');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('json spaces', 2);

app.get('/api/check', async (req, res) => {
    const uid = req.query.uid;

    if (!uid) {
        return res.status(400).json({ error: "UID parameter is required" });
    }

    try {
        // High-level fake headers to bypass basic Cloudflare block
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1'
        };

        // 1. Homepage hit karke Nonce nikalna
        console.log("🔍 Fetching nonce from website...");
        const pageResponse = await axios.get('https://freefirenation.com/free-fire-player-info-tool/', { 
            headers: headers,
            timeout: 10000 
        }); // Fixed: Closed the axios.get call

        // Send a response back so the request doesn't hang
        res.json({ message: "Successfully fetched", data: pageResponse.data });

    } catch (error) { // Fixed: Added the missing catch block
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}); // Fixed: Closed the app.get route

// Fixed: Added app.listen so the server actually runs
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
