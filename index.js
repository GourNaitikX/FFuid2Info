const express = require('express');
const axios = require('axios');
const qs = require('qs');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('json spaces', 2);

app.get('/api/check', async (req, res) => {
    const uid = req.query.uid;
    const region = req.query.region || 'IND'; 

    if (!uid) {
        return res.status(400).json({ error: "UID parameter is required" });
    }

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };

        // Step 1: Fetching homepage for nonce AND Cookies
        console.log("🔍 Fetching homepage for nonce and cookies...");
        const pageResponse = await axios.get('https://freefirenation.com/free-fire-player-info-tool/', {
            headers: headers,
            timeout: 15000 
        });

        const htmlCode = pageResponse.data;
        
        // 🔥 COOKIES PAKAD LI: Ye sabse important step hai
        const rawCookies = pageResponse.headers['set-cookie'];
        let formattedCookies = "";
        if (rawCookies) {
            formattedCookies = rawCookies.map(cookie => cookie.split(';')[0]).join('; ');
            console.log("🍪 Cookies saved!");
        }

        let nonceValue = "";
        // Website ki script se exact nonce nikalne ka regex
        const nonceMatch = htmlCode.match(/"nonce":"([^"]+)"/) || htmlCode.match(/name="[^"]*nonce[^"]*" value="([^"]+)"/);

        if (nonceMatch && nonceMatch[1]) {
            nonceValue = nonceMatch[1];
            console.log("✅ Nonce found:", nonceValue);
        } else {
            console.log("⚠️ Warning: Nonce nahi mila!");
        }

        // Step 2: Payload setup
        const requestPayload = qs.stringify({
            action: 'ff_get_player_info',
            uid: uid,                     
            region: region,               
            nonce: nonceValue
        });

        // Step 3: API Request bhej rahe hain (Cookies ke sath)
        console.log("🚀 Fetching Player Data...");
        const dataResponse = await axios.post('https://freefirenation.com/wp-admin/admin-ajax.php', requestPayload, {
            headers: {
                ...headers,
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': formattedCookies // 🔥 Wahi cookies wapas bhej rahe hain
            },
            timeout: 15000
        });

        // Step 4: Output send karna
        res.json({
            message: "Successfully fetched",
            data: dataResponse.data
        });

    } catch (error) {
        console.error("❌ Error occurred:", error.message);
        
        res.status(500).json({
            error: "Internal Server Error",
            debug_info: {
                axiosErrorMessage: error.message,
                targetStatusCode: error.response ? error.response.status : "No status code from target",
                targetResponseData: error.response ? error.response.data : "No data returned from target"
            }
        });
    }
});

// Server Start
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
