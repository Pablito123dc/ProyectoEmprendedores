const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const res = await axios.get('https://www.amazon.com/dp/B08N5WRWNW', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    const $ = cheerio.load(res.data);
    console.log('Title:', $('#productTitle').text().trim() || $('title').text().trim());
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
