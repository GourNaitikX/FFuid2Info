const express = require('express');
const axios = require('axios');
const qs = require('qs');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON output ko clean aur formatted dikhane ke liye
app.set('json spaces', 2);

app.get('/api/check', async (req, res) => {
    const uid = req.query.uid;
    const region = req.query.region || 'IND'; 

    if (!uid) {
        return res.status(400).json({ 
            "𝗖𝗿𝗲𝗮𝘁𝗼𝗿": "🌟 𝗔𝗽𝗶 𝗕𝘆 @𝗭𝗲𝗿𝗼𝗦𝗽𝗮𝗱𝗲 🌟",
            "Error": "UID parameter is required" 
        });
    }

    try {
        const baseHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://freefirenation.com/',
            'Accept-Language': 'en-US,en;q=0.9',
        };

        // 1. Homepage se Nonce aur Cookies nikalna
        const pageResponse = await axios.get('https://freefirenation.com/free-fire-player-info-tool/', {
            headers: baseHeaders,
            timeout: 15000 
        });

        const htmlCode = pageResponse.data;
        
        // Cookies extract karna
        const rawCookies = pageResponse.headers['set-cookie'];
        let formattedCookies = "";
        if (rawCookies) {
            formattedCookies = rawCookies.map(cookie => cookie.split(';')[0]).join('; ');
        }

        // JS Variable se Nonce nikalna (100% Working)
        const nonceMatch = htmlCode.match(/var\s+ffNonce\s*=\s*['"]([^'"]+)['"]/);
        let nonceValue = nonceMatch ? nonceMatch[1] : "";

        if (!nonceValue) {
            return res.status(500).json({ 
                "𝗖𝗿𝗲𝗮𝘁𝗼𝗿": "🌟 𝗔𝗽𝗶 𝗕𝘆 @𝗭𝗲𝗿𝗼𝗦𝗽𝗮𝗱𝗲 🌟",
                "Error": "Security token (Nonce) nahi mila." 
            });
        }

        const requestPayload = qs.stringify({
            action: 'ff_get_player_info',
            uid: uid,                     
            region: region,               
            nonce: nonceValue
        });

        // 2. Asli Data Fetch Karna API se
        const dataResponse = await axios.post('https://freefirenation.com/wp-admin/admin-ajax.php', requestPayload, {
            headers: {
                ...baseHeaders,
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'https://freefirenation.com',
                'Referer': 'https://freefirenation.com/free-fire-player-info-tool/',
                'Cookie': formattedCookies 
            },
            timeout: 15000
        });

        const responseData = dataResponse.data;

        // 3. JSON Filter karke sirf zaruri data bhejna
        if (responseData && responseData.success && responseData.data && (responseData.data.basicInfo || responseData.data.basicinfo)) {
            // WordPress API kabhi camelCase bhejti hai, kabhi lowercase
            const playerInfo = responseData.data.basicInfo || responseData.data.basicinfo;
            
            return res.json({
                "𝗖𝗿𝗲𝗮𝘁𝗼𝗿": "✨ 𝗔𝗽𝗶 𝗕𝘆 @𝗭𝗲𝗿𝗼𝗦𝗽𝗮𝗱𝗲 ✨",
                "Status": "Success",
                "Player_Details": {
                    "Name": playerInfo.nickname || "N/A",
                    "Level": playerInfo.level || "N/A",
                    "Likes": playerInfo.liked || "0",
                    "Region": playerInfo.region || region
                }
            });
        } else {
            return res.json({
                "𝗖𝗿𝗲𝗮𝘁𝗼𝗿": "✨ 𝗔𝗽𝗶 𝗕𝘆 @𝗭𝗲𝗿𝗼𝗦𝗽𝗮𝗱𝗲 ✨",
                "Status": "Failed",
                "Message": "Player not found or invalid UID."
            });
        }

    } catch (error) {
        res.status(500).json({
            "𝗖𝗿𝗲𝗮𝘁𝗼𝗿": "✨ 𝗔𝗽𝗶 𝗕𝘆 @𝗭𝗲𝗿𝗼𝗦𝗽𝗮𝗱𝗲 ✨",
            "Error": "Internal Server Error",
            "Details": error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
