const DB_CARRITO = "carrito_local";

// CONFIGURACIÓN DEL ROBOT COTIZADOR
// Si usas GitHub Pages, copia aquí el link que te da el archivo .bat (localtunnel)
// Ejemplo: const API_BASE = "https://tu-link-de-localtunnel.loca.lt";
const API_BASE = ""; 

function obtenerCarrito() {
  return JSON.parse(localStorage.getItem(DB_CARRITO)) || [];
}

function guardarCarrito(carrito) {
  localStorage.setItem(DB_CARRITO, JSON.stringify(carrito));
}

// Añadir al carrito
function agregarAlCarrito(idProducto) {
  verificarAutenticacion(() => {
    // En lugar de leer a la base de datos de nuevo, lo leemos de la caché del DOM
    const productos = window.cacheProductos || [];
    const carrito = obtenerCarrito();

    const producto = productos.find(p => p.id === idProducto);
    
    if(!producto) {
       alert("Producto no encontrado. Recarga la página por favor.");
       return;
    }

    carrito.push(producto);
    guardarCarrito(carrito);

    alert("¡Añadiste el producto a tu carrito exitosamente!");
  });
}

let cotizacionPendiente = null;

async function solicitarCotizacionLink() {
  verificarAutenticacion(async () => {
    const input = document.getElementById("link-cotizacion");
    const btn = document.getElementById("btn-cotizar");
    const previewContainer = document.getElementById("preview-container");
    const url = input.value.trim();

    if (!url || !url.startsWith("http")) {
      alert("Por favor inserta un enlace válido.");
      return;
    }

    // Estado de carga
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Robot Pensando...';
    btn.disabled = true;

    try {
      // 1. Llamar a nuestro servidor local o desplegado en Render/Vercel
      const response = await fetch(`${API_BASE}/api/amazon-preview?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error('Servidor no respondió correctamente');
      }

      const data = await response.json();

      // 2. Mostrar la previsualización mágica
      document.getElementById('preview-image').src = data.image;
      document.getElementById('preview-title').innerText = data.title;
      document.getElementById('preview-price').innerText = data.price;
      
      previewContainer.style.display = 'block';

      // 3. Guardar temporalmente en memoria para pasarlo al carrito
      cotizacionPendiente = {
        id: Date.now(),
        nombre: "Cotización: " + data.title.split(' ').slice(0, 4).join(' '),
        descripcion: url,
        precio: 0,
        esLinkEspecial: true,
        imagenVirtual: data.image
      };

    } catch (error) {
      console.error(error);
      alert("No pudimos extraer los datos mágicamente. Asegúrate de tener encendido el Servidor Node (node index.js). Por ahora, igual puedes añadirlo al carrito manualmente haciendo clic de nuevo.");
      
      // Fallback manual (si el server node está apagado)
      cotizacionPendiente = {
        id: Date.now(),
        nombre: "Cotización Especial (URL)",
        descripcion: url,
        precio: 0,
        esLinkEspecial: true
      };
      
      previewContainer.style.display = 'none';
      confirmarAgregadoAlCarritoDeCotizacion();
    }

    // Restaurar botón
    btn.innerHTML = originalBtnText;
    btn.disabled = false;
  });
}

function confirmarAgregadoAlCarritoDeCotizacion() {
  if (!cotizacionPendiente) return;

  const carrito = obtenerCarrito();
  carrito.push(cotizacionPendiente);
  guardarCarrito(carrito);

  alert("¡Producto añadido al carrito para cotización oficial!");
  
  // Limpiar
  document.getElementById("link-cotizacion").value = "";
  document.getElementById("preview-container").style.display = 'none';
  cotizacionPendiente = null;
  
  if(document.getElementById("carrito").style.display !== 'none') {
     mostrarCarrito();
  }
}

// Mostrar carrito
function mostrarCarrito() {
  const contenedor = document.getElementById("carrito");
  contenedor.innerHTML = "";

  const carrito = obtenerCarrito();

  if (carrito.length === 0) {
    contenedor.innerHTML = "<div class='empty-state'><i class='fa-solid fa-cart-shopping fa-3x' style='margin-bottom: 20px; color: #CBD5E1'></i><br>No tienes productos en el carrito</div>";
    return;
  }

  let total = 0;
  let hayLinksUnicos = false;
  let html = "";

  carrito.forEach((p, index) => {
    let precioHtml = p.esLinkEspecial ? `<span style="color:#F59E0B; font-size:1.4rem;">Cotizando link... <i class="fa-solid fa-magnifying-glass"></i></span>` : `Q${p.precio}`;
    if (!p.esLinkEspecial) {
      total += p.precio;
    } else {
      hayLinksUnicos = true;
    }

    let tituloHtml = p.esLinkEspecial ? `<a href="${p.descripcion}" target="_blank" style="word-break:break-all; font-size:0.9rem;">${p.descripcion}</a>` : ``;

    html += `
      <div class="producto" style="position:relative;">
        <button class="btn-remove-item" onclick="eliminarItem(${index})" title="Quitar producto"><i class="fa-solid fa-trash"></i></button>
        <div style="font-size: 2rem; color: #94A3B8; margin-bottom: 10px; margin-top: 15px;"><i class="fa-solid ${p.esLinkEspecial ? 'fa-link' : 'fa-box'}"></i></div>
        <h3>${p.nombre}</h3>
        ${tituloHtml}
        <p class="precio" style="margin: 10px 0;">${precioHtml}</p>
      </div>
    `;
  });

  html += `
    <div class="carrito-summary">
      <h3>Subtotal a Importar: <span style="color: var(--primary-color)">Q${total}</span> ${hayLinksUnicos ? '<span style="font-size:0.9rem; color:#6B7280;"> (+ Cotizaciones pendientes)</span>' : ''}</h3>
      <button class="btn-confirmar" onclick="crearPedido()"><i class="fa-solid fa-check"></i> Proceder con el Pedido</button>
      <button class="btn-vaciar" onclick="vaciarCarrito()"><i class="fa-solid fa-trash-can"></i> Vaciar toda la canasta</button>
    </div>
  `;
  
  contenedor.innerHTML = html;
}

function eliminarItem(index) {
  const carrito = obtenerCarrito();
  carrito.splice(index, 1);
  guardarCarrito(carrito);
  mostrarCarrito(); // Refrescar la vista
}

// Vaciar carrito
function vaciarCarrito() {
  localStorage.removeItem(DB_CARRITO);
  mostrarCarrito();
}