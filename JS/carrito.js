const DB_CARRITO = "carrito_local";

// CONFIGURACIÓN DEL ROBOT COTIZADOR (Rainforest API)
const API_KEY_RAINFOREST = "E4D41E73E3344211A706CC7F2A3A1C1F";
const API_BASE = "https://api.rainforestapi.com/request";

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
      // LLAMADA DIRECTA A RAINFOREST API
      const params = new URLSearchParams({
        api_key: API_KEY_RAINFOREST,
        type: 'product',
        url: url
      });

      const response = await fetch(`${API_BASE}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error en la comunicación con la API');
      }

      const data = await response.json();

      if (!data.product) {
        throw new Error('No se encontraron datos del producto');
      }

      // Mapear datos de Rainforest al formato de nuestra tienda
      const productTitle = data.product.title;
      const productImage = data.product.main_image?.link || 'https://via.placeholder.com/150';
      const productPrice = data.product.buybox_winner?.price?.raw || data.product.price?.raw || "Ver en Amazon";

      // 2. Mostrar la previsualización mágica
      document.getElementById('preview-image').src = productImage;
      document.getElementById('preview-title').innerText = productTitle;
      document.getElementById('preview-price').innerText = productPrice;
      
      previewContainer.style.display = 'block';

      // 3. Guardar temporalmente en memoria
      cotizacionPendiente = {
        id: Date.now(),
        nombre: "Cotización: " + productTitle.split(' ').slice(0, 4).join(' '),
        descripcion: url,
        precio: 0,
        esLinkEspecial: true,
        imagenVirtual: productImage
      };

      // 4. ✨ Guardar automáticamente como TENDENCIA en Firebase
      guardarTendencia({
        nombre: productTitle.split(' ').slice(0, 6).join(' '),
        imagen: productImage,
        url: url,
        precio: 0,
        descripcion: "Producto solicitado por clientes de Importaciones GT",
        esLinkEspecial: true
      });

    } catch (error) {
      console.error(error);
      alert("Lo siento, el robot está cansado o el link no es compatible. Inténtalo de nuevo o agrega el producto manualmente.");
      previewContainer.style.display = 'none';
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

  // Guardar cotización en Firebase bajo el usuario
  const usuario = typeof obtenerUsuarioActual === 'function' ? obtenerUsuarioActual() : null;
  if (usuario && typeof db !== 'undefined') {
    db.collection('cotizaciones').add({
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      usuarioCorreo: usuario.correo,
      producto: cotizacionPendiente,
      fecha: new Date().toISOString(),
      estado: 'pendiente'
    }).catch(e => console.warn('No se guardó cotización en nube:', e.message));
  }

  alert("¡Producto añadido al carrito para cotización oficial!");
  
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

// ── Guardar producto como TENDENCIA en Firebase ──
async function guardarTendencia(producto) {
  try {
    if (typeof db === 'undefined') return;

    // Evitar duplicados: si el mismo URL ya existe, solo suma una solicitud
    const existe = await db.collection('tendencias')
      .where('url', '==', producto.url)
      .get();

    if (!existe.empty) {
      const docId = existe.docs[0].id;
      const solicitudes = (existe.docs[0].data().solicitudes || 1) + 1;
      await db.collection('tendencias').doc(docId).update({
        solicitudes: solicitudes,
        ultimaSolicitud: new Date().toISOString()
      });
      console.log("Tendencia actualizada:", producto.nombre, "| Solicitudes:", solicitudes);
    } else {
      await db.collection('tendencias').add({
        id: Date.now(),
        nombre: producto.nombre,
        imagen: producto.imagen,
        url: producto.url,
        precio: 0,
        descripcion: "Producto solicitado por clientes de Importaciones GT",
        esLinkEspecial: true,
        solicitudes: 1,
        fechaPrimera: new Date().toISOString()
      });
      console.log("Nueva tendencia guardada:", producto.nombre);
    }
  } catch(e) {
    console.warn("No se pudo guardar tendencia:", e.message);
  }
}