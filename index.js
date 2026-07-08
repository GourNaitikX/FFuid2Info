const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        service: "Free Fire Player Info Scraper API",
        usage: "/api/check?uid=YOUR_UID"
    });
});

app.get('/api/check', async (req, res) => {
    const uid = req.query.uid;

    if (!uid) {
        return res.status(400).json({ error: "UID parameter is required" });
    }

    let browser;
    try {
        // Launch Puppeteer with specific args required for cloud environments like Railway
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // Block images and CSS to make scraping much faster
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // 1. Go to the website
        await page.goto('https://freefirenation.com/free-fire-player-info-tool/', { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
        });

        // 2. Type the UID into the input field
        // Finding the input by its placeholder as seen in your screenshot
        const inputSelector = 'input[placeholder*="Enter Free Fire UID"]';
        await page.waitForSelector(inputSelector, { timeout: 10000 });
        await page.type(inputSelector, uid);

        // 3. Click the "Check Player" button
        // Finding the button that contains the text "Check Player"
        const [button] = await page.$x("//button[contains(., 'Check Player')]");
        if (button) {
            await button.click();
        } else {
            throw new Error("Check Player button not found");
        }

        // 4. Wait for the results to load (waiting for the UID label to appear in the results)
        await page.waitForXPath("//div[contains(text(), 'UID:')]", { timeout: 15000 });

        // 5. Extract the data
        const playerData = await page.evaluate(() => {
            const extractTextByLabel = (labelText) => {
                // Find elements containing the label (e.g., "Level:", "Likes:")
                const elements = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3'));
                const labelElement = elements.find(el => el.textContent.trim().startsWith(labelText));
                
                if (labelElement) {
                    // Usually, the value is in the next sibling or a child element
                    return labelElement.parentElement.textContent.replace(labelText, '').trim();
                }
                return null;
            };

            // Extract Name (Usually the largest text or next to a copy button)
            // Looking for the main profile header text
            let name = "Unknown";
            const h2Elements = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
            // The name usually appears before the Copy button
            const copyButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Copy'));
            if (copyButton && copyButton.previousElementSibling) {
                name = copyButton.previousElementSibling.textContent.trim();
            } else if (copyButton && copyButton.parentElement) {
                 name = copyButton.parentElement.textContent.replace('Copy', '').trim();
            } else {
                // Fallback to finding large text
                name = h2Elements.length > 0 ? h2Elements[0].textContent.trim() : "Unknown";
            }

            return {
                Name: name,
                Level: extractTextByLabel("Level:"),
                Likes: extractTextByLabel("Likes:"),
                Region: extractTextByLabel("Region:")
            };
        });

        await browser.close();

        // 6. Return the JSON response
        return res.json({
            success: true,
            data: {
                uid: uid,
                ...playerData
            }
        });

    } catch (error) {
        if (browser) await browser.close();
        return res.status(500).json({ 
            success: false, 
            error: "Failed to fetch player data or player not found.",
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
