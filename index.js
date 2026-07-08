const express = require('express');
const axios = require('axios');
const qs = require('qs');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('json spaces', 2);

app.get('/', (req, res) => {
    res.json({
        service: "Free Fire Fast Player Info API",
        developer: "ETHICAL HACKER BD",
        usage: "/api/check?uid=YOUR_UID"
    });
});

app.get('/api/check', async (req, res) => {
    const uid = req.query.uid;

    if (!uid) {
        return res.status(400).json({ error: "UID parameter is required" });
    }

    try {
        // Common headers taaki hum bot na lagein
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive'
        };

        // ==========================================
        // STEP 1: Main page se 'nonce' security token churana
        // ==========================================
        const pageResponse = await axios.get('https://freefirenation.com/free-fire-player-info-tool/', { headers });
        const html = pageResponse.data;

        // Regex se nonce dhundna (WordPress hamesha nonce ek script object me rakhta hai)
        // Hum 10-character ka hex string dhund rahe hain jo nonce ke aas-paas ho
        let nonce = "";
        const nonceMatch = html.match(/nonce["']?\s*:\s*["']([a-f0-9]{10})["']/i);
        
        if (nonceMatch && nonceMatch[1]) {
            nonce = nonceMatch[1];
            console.log(`✅ Naya Nonce Mil Gaya: ${nonce}`);
        } else {
            // Agar pehla regex fail ho jaye toh alternate check (data-nonce attribute)
            const altNonceMatch = html.match(/data-nonce=["']([a-f0-9]{10})["']/i);
            if (altNonceMatch && altNonceMatch[1]) {
                nonce = altNonceMatch[1];
                console.log(`✅ Alternate Nonce Mil Gaya: ${nonce}`);
            } else {
                throw new Error("Security token (nonce) nahi mila.");
            }
        }

        // ==========================================
        // STEP 2: Hidden API par POST request bhejna
        // ==========================================
        const targetUrl = 'https://freefirenation.com/wp-admin/admin-ajax.php';
        
        // Payload ko usi format me set karna jo aapke screenshot me tha (x-www-form-urlencoded)
        const payload = qs.stringify({
            action: 'ff_get_player_info',
            uid: uid,
            region: 'IND', // India region default set hai site par
            nonce: nonce
        });

        const apiResponse = await axios.post(targetUrl, payload, {
            headers: {
                ...headers,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest', // Yeh batata hai ki yeh AJAX request hai
                'Origin': 'https://freefirenation.com',
                'Referer': 'https://freefirenation.com/free-fire-player-info-tool/'
            },
            timeout: 8000 // 8 second timeout
        });

        const data = apiResponse.data;

        if (!data.success || !data.data || !data.data.basicInfo) {
            return res.status(404).json({
                success: false,
                error: "Player nahi mila ya UID galat hai."
            });
        }

        const basicInfo = data.data.basicInfo;

        // ==========================================
        // STEP 3: Final Clean JSON Return Karna
        // ==========================================
        return res.json({
            success: true,
            data: {
                Name: basicInfo.nickname || "Unknown",
                UID: uid,
                Level: basicInfo.level || 0,
                Likes: basicInfo.liked || basicInfo.likes || 0,
                Region: data.data.detected_region || "IND",
                Account_Created: basicInfo.createAt || "Unknown",
                Ban_Status: data.data.ban_check ? data.data.ban_check.status : "Unknown"
            },
            developer: "ETHICAL HACKER BD"
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
        return res.status(500).json({
            success: false,
            error: "Data fetch karne me problem hui.",
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Fast API Server is running on port ${PORT}`);
});
