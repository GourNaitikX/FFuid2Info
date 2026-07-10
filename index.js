const express = require('express');
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
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
        };

        // 1. Homepage hit karke pura HTML nikalna
        console.log("🔍 Fetching homepage for nonce...");
        const pageResponse = await axios.get('https://freefirenation.com/free-fire-player-info-tool/', { 
            headers: headers,
            timeout: 10000 
        });

        const htmlCode = pageResponse.data;

        // 2. HTML se Nonce extract karna Regex ka use karke
        // Note: Ye regex website ke exact format pe depend karega
        let nonceValue = "";
        const nonceMatch = htmlCode.match(/"nonce":"([^"]+)"/) || htmlCode.match(/name="[^"]*nonce[^"]*" value="([^"]+)"/);
        
        if (nonceMatch && nonceMatch[1]) {
            nonceValue = nonceMatch[1];
            console.log("✅ Nonce found:", nonceValue);
        } else {
            console.log("⚠️ Nonce nahi mila, maybe direct call kaam kar jaye.");
        }

        // 3. Asli Player Data fetch karne ke liye backend API call (POST request)
        // Niche diye gaye 'action' ka naam aapko network tab se dekhna hoga
        const requestPayload = qs.stringify({
            action: 'ff_player_info_action', // Yaha unki website ka real action name aayega
            uid: uid,
            nonce: nonceValue // Jo token upar nikala wo yaha jayega
        });

        console.log("🚀 Fetching Player Data...");
        const dataResponse = await axios.post('https://freefirenation.com/wp-admin/admin-ajax.php', requestPayload, {
            headers: {
                ...headers,
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest' // AJAX show karne ke liye
            },
            timeout: 10000
        });

        // 4. Final Game Data (Likes, Level, Name) user ko send karna
        res.json({ 
            message: "Successfully fetched", 
            data: dataResponse.data 
        });

    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
