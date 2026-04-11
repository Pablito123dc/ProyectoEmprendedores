const DB_CARRITO = "carrito_local";

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

function solicitarCotizacionLink() {
  verificarAutenticacion(() => {
    const input = document.getElementById("link-cotizacion");
    const url = input.value.trim();

    if (!url || !url.startsWith("http")) {
      alert("Por favor inserta un enlace válido (asegúrate que comience con http:// o https://).");
      return;
    }

    const carrito = obtenerCarrito();
    const productoLink = {
      id: Date.now(),
      nombre: "Cotización Especial (URL)",
      descripcion: url,
      precio: 0,
      esLinkEspecial: true
    };

    carrito.push(productoLink);
    guardarCarrito(carrito);

    alert("¡Enlace añadido al carrito para cotización!");
    input.value = "";
    
    if(document.getElementById("carrito").style.display !== 'none') {
       mostrarCarrito();
    }
  });
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