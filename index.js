const express = require('express');
const axios = require('axios');
const qs = require('qs');

const app = express();
// Port 8080 set kiya hai Railway ke liye
const PORT = process.env.PORT || 8080;

app.set('json spaces', 2);

// Railway Health Check ke liye Root Route
app.get('/', (req, res) => {
    res.status(200).send("🚀 Server is live and running perfectly!");
});

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

        console.log(`🔍 Fetching data for UID: ${uid}...`);

        // Homepage hit karke request bhejna
        const pageResponse = await axios.get('https://freefirenation.com/free-fire-player-info-tool/', { 
            headers: headers,
            timeout: 8000 // 8 seconds timeout
        });

        // Agar success hua toh ye response jayega
        res.status(200).json({
            success: true,
            message: "Data fetched successfully",
            uid: uid,
            status_code: pageResponse.status
        });

    } catch (error) {
        console.error("❌ AXIOS ERROR:", error.message);

        // Agar timeout ho gaya ho
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ 
                success: false, 
                error: "Request Timeout - Target website ne respond nahi kiya" 
            });
        }

        // Agar website ne 403 (Forbidden) ya 429 (Rate Limit) diya ho
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                error: "Target website blocked the request",
                status: error.response.status
            });
        }

        // Baki koi bhi internal error
        res.status(500).json({ 
            success: false, 
            error: "Internal Server Error", 
            details: error.message 
        });
    }
});

// CRITICAL FIX: '0.0.0.0' add kiya hai taaki Railway crash na kare
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Fast API Server is running on port ${PORT}`);
});
