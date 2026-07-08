const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON output ko beautiful format mein dikhane ke liye
app.set('json spaces', 2);

// ============ Home Route ============
app.get('/', (req, res) => {
    res.json({
        "🚀 Service": "Super Fast Free Fire Player Info API",
        "💎 Developer": "ETHICAL HACKER BD",
        "🔗 GitHub": "github.com/cyberarafatofficial",
        "📌 Usage": "/api/info?uid=YOUR_UID"
    });
});

// ============ Main API Route ============
app.get('/api/info', async (req, res) => {
    const uid = req.query.uid || req.query.id;

    // Check if UID is provided
    if (!uid) {
        return res.status(400).json({ 
            success: false, 
            error: "UID required", 
            example: "/api/info?uid=123456789" 
        });
    }

    try {
        // 1. Fetch Nickname and Region from Shop2Game
        const shop2gameResponse = await axios.post(
            'https://shop2game.com/api/auth/player_id_login',
            {
                app_id: 100067,
                login_id: uid,
                app_server_id: 0
            },
            {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://shop2game.com',
                    'Referer': 'https://shop2game.com/app/100067/idlogin',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Redmi Note 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
                    'Content-Type': 'application/json',
                    // Sending cookies as a single string
                    'Cookie': '_ga=GA1.1.2123120599.1674510784; _fbp=fb.1.1674510785537.363500115; session_key=efwfzwesi9ui8drux4pmqix4cosane0y; datadome=6h5F5cx_GpbuNtAkftMpDjsbLcL3op_5W5Z-npxeT_qcEe_7pvil2EuJ6l~JlYDxEALeyvKTz3~LyC1opQgdP~7~UDJ0jYcP5p20IQlT3aBEIKDYLH~cqdfXnnR6FAL0'
                },
                timeout: 10000 // 10 seconds max wait time
            }
        );

        const playerData = shop2gameResponse.data;

        // Agar ID exist nahi karti
        if (!playerData.nickname) {
            return res.status(404).json({ 
                success: false, 
                error: "ID NOT FOUND",
                uid: uid
            });
        }

        // 2. Fetch Ban Status from Garena Anti-Hack API
        let banStatus = "Unknown";
        try {
            const banResponse = await axios.get(
                `https://ff.garena.com/api/antihack/check_banned?lang=en&uid=${uid}`, 
                { timeout: 5000 }
            );
            banStatus = banResponse.data.ban_status || "Unknown";
        } catch (err) {
            // Agar ban status fail bhi ho jaye, toh script nahi rukegi
            console.log("Ban check failed:", err.message);
        }

        // 3. Final JSON Response Return Karna
        return res.json({
            success: true,
            uid: uid,
            nickname: playerData.nickname,
            region: playerData.region,
            ban_status: banStatus,
            api_owner: "ETHICAL HACKER BD"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "API Request Failed",
            details: error.message
        });
    }
});

// ============ Server Start ============
app.listen(PORT, () => {
    console.log(`\n🚀 Fast API Server is running on port ${PORT}`);
    console.log(`💎 Developer: ETHICAL HACKER BD\n`);
});
