import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        await page.goto('http://localhost:5173/shop', { waitUntil: 'networkidle0' });

        await browser.close();
    } catch (e) {
        console.error('SCRIPT ERROR:', e);
    }
})();
