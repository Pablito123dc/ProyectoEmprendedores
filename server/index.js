const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');

puppeteer.use(StealthPlugin());

const app = express();
app.use(cors()); // Permite que tu frontend solicite datos a este servidor
app.use(express.json());

// Servir archivos del frontend (Página web) en el mismo puerto que la API
app.use(express.static(path.join(__dirname, '../')));

// Ruta principal de nuestra API
app.get('/api/amazon-preview', async (req, res) => {
  const url = req.query.url;

  if (!url || !url.includes('amazon.')) {
    return res.status(400).json({ error: 'URL no válida. Debe ser un enlace de Amazon.' });
  }

  let browser;
  try {
    // Iniciamos Puppeteer de forma invisible (headless)
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();
    
    // Configuramos un User-Agent de navegador real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navegamos a la URL de Amazon
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Extraemos los datos usando el DOM de la página real
    const data = await page.evaluate(() => {
      let title = document.querySelector('#productTitle')?.innerText?.trim() || document.title || 'Producto de Amazon';
      
      // Intentamos capturar la imagen principal usando varios selectores posibles en Amazon
      let image = document.querySelector('#landingImage')?.src || 
                  document.querySelector('#imgBlkFront')?.src || 
                  document.querySelector('.a-dynamic-image')?.src ||
                  document.querySelector('meta[property="og:image"]')?.content ||
                  'https://via.placeholder.com/400x400?text=Imagen+No+Disponible';
                  
      let price = document.querySelector('.a-price .a-offscreen')?.innerText?.trim() || 'Variable';

      return { title, image, price };
    });

    if (data.title.toLowerCase().includes("bot") || data.title.toLowerCase().includes("captcha")) {
      throw new Error("Página bloqueada por Amazon Bot Protection");
    }

    res.json({
      title: data.title.length > 80 ? data.title.substring(0, 80) + '...' : data.title,
      image: data.image,
      price: data.price
    });

  } catch (error) {
    console.error("Error extrayendo con Puppeteer:", error.message);
    res.json({
      title: 'Producto bloqueado temporalmente por la seguridad de Amazon (Ejemplo visual activado)',
      image: 'https://images.unsplash.com/photo-1603539947678-eb3dececfdae?auto=format&fit=crop&w=400&q=80',
      price: '$??.?? (Cotizar al confirmar)'
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Robot de Amazon (Modo Avanzado Puppeteer Stealth) iniciado correctamente.`);
  console.log(`El servidor está escuchando en http://localhost:${PORT}`);
  console.log(`Manten esta ventana abierta mientras usas el cotizador de tu página.`);
});
