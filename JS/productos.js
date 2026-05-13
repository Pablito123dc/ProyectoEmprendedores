// Obtener productos manuales desde Firebase
async function obtenerProductos() {
  try {
    const snapshot = await db.collection('productos').get();
    const productos = [];
    snapshot.forEach(doc => {
      productos.push({ firebaseId: doc.id, ...doc.data() });
    });
    return productos;
  } catch(e) {
    console.error("No se pudo obtener productos", e);
    return [];
  }
}

// Obtener ofertas de Amazon desde Firebase
async function obtenerOfertas() {
  try {
    const snapshot = await db.collection('ofertas').get();
    const ofertas = [];
    snapshot.forEach(doc => {
      ofertas.push({ firebaseId: doc.id, ...doc.data(), esOferta: true });
    });
    return ofertas;
  } catch(e) {
    console.error("No se pudo obtener ofertas", e);
    return [];
  }
}

// Función unificada para mostrar productos en cualquier contenedor
async function renderizarProductos(contenedorId, soloOfertas = false) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>';

  const ofertas = await obtenerOfertas();
  let productos = [];
  
  if (!soloOfertas) {
    const manuales = await obtenerProductos();
    productos = [...manuales, ...ofertas];
  } else {
    productos = ofertas;
  }

  if (productos.length === 0) {
    contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #64748B;">No hay productos disponibles en este momento.</div>';
    return;
  }

  contenedor.innerHTML = "";
  productos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'producto';
    card.innerHTML = `
      ${p.esOferta ? '<span class="tag-oferta" style="background: var(--red-vivid); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; position: absolute; top: 10px; left: 10px; z-index: 5;">OFERTA GLOBAL</span>' : ''}
      <img src="${p.imagen || 'ASSETS/imagenilustrativa.jpg'}" alt="${p.nombre}">
      <div class="producto-info" style="padding: 15px;">
        <h3 style="font-size: 1rem; margin-bottom: 10px; height: 40px; overflow: hidden;">${p.nombre}</h3>
        <p style="font-size: 1.2rem; font-weight: 800; color: var(--blue-mid); margin-bottom: 15px;">Q${p.precio}</p>
        <button class="nav-btn active" style="width: 100%; justify-content: center;" onclick="agregarAlCarrito(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.precio}, '${p.imagen}')">
          <i class="fa-solid fa-cart-plus"></i> Añadir al Carrito
        </button>
      </div>
    `;
    card.style.position = 'relative';
    contenedor.appendChild(card);
  });
}

// Para compatibilidad con tienda.html
async function mostrarProductos() {
  renderizarProductos('catalogo');
}

// Crear producto en Firebase (usado por admin)
async function crearProducto(producto) {
  try {
    producto.id = Date.now();
    await db.collection('productos').add(producto);
    return true;
  } catch (error) {
    console.error("Error al crear producto: ", error);
    return false;
  }
}
