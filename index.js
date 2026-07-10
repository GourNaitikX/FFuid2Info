const express = require('express');
const axios = require('axios');
const qs = require('qs');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON response ko thoda clean dikhane ke liye
app.set('json spaces', 2);

app.get('/api/check', async (req, res) => {
    const uid = req.query.uid;

    if (!uid) {
        return res.status(400).json({ error: "UID parameter is required" });
    }

    try {
        // Headers set kar rahe hain taaki request browser jaisi lage
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };

        // Step 1: Homepage fetch karna Nonce ke liye
        console.log("🔍 Fetching homepage for nonce...");
        const pageResponse = await axios.get('https://freefirenation.com/free-fire-player-info-tool/', {
            headers: headers,
            timeout: 15000 // Timeout badha diya taaki jaldi fail na ho
        });

        const htmlCode = pageResponse.data;
        let nonceValue = "";
        
        // Regex se Nonce nikalna (Agar website security token use kar rahi hai)
        const nonceMatch = htmlCode.match(/"nonce":"([^"]+)"/) || htmlCode.match(/name="[^"]*nonce[^"]*" value="([^"]+)"/);

        if (nonceMatch && nonceMatch[1]) {
            nonceValue = nonceMatch[1];
            console.log("✅ Nonce found:", nonceValue);
        }

        // Step 2: Payload setup karna 
        // DHYAN DE: Agar API fail ho rahi hai, to 'ff_player_info_action' ko unki website ke real action name se change karna hoga
        const requestPayload = qs.stringify({
            action: 'ff_player_info_action', 
            uid: uid,
            nonce: nonceValue
        });

        // Step 3: Asli Data fetch karne ke liye POST request
        console.log("🚀 Fetching Player Data...");
        const dataResponse = await axios.post('https://freefirenation.com/wp-admin/admin-ajax.php', requestPayload, {
            headers: {
                ...headers,
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 15000
        });

        // Step 4: Success Response bhejna
        res.json({
            message: "Successfully fetched",
            data: dataResponse.data
        });

    } catch (error) {
        // Step 5: Advanced Error Debugging for Vercel
        // Ye aapko actual error print karke dega screen par
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
