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

  contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--blue-mid);"></i></div>';

  try {
    let productos = [];
    
    if (!soloOfertas) {
      // Cargar productos manuales del admin
      const snapProductos = await db.collection('productos').get();
      snapProductos.forEach(doc => productos.push({ firebaseId: doc.id, ...doc.data() }));
    }

    // Cargar tendencias (solicitudes de clientes)
    const snapTendencias = await db.collection('tendencias')
      .orderBy('solicitudes', 'desc')
      .limit(8)
      .get();
    snapTendencias.forEach(doc => productos.push({ 
      firebaseId: doc.id, ...doc.data(), esTendencia: true 
    }));

    if (productos.length === 0) {
      contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #64748B;"><i class="fa-solid fa-box-open fa-3x" style="margin-bottom: 20px;"></i><br>No hay productos disponibles aún.</div>';
      return;
    }

    contenedor.innerHTML = "";
    productos.forEach(p => {
      const card = document.createElement('div');
      card.className = 'producto';
      const badge = p.esTendencia 
        ? `<span style="background: var(--blue-mid); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; position: absolute; top: 10px; left: 10px; z-index: 5;">🔥 ${p.solicitudes || 1} solicitud${(p.solicitudes||1) > 1 ? 'es' : ''}</span>`
        : '';
      const imgSrc = p.imagen || p.imagenVirtual || 'ASSETS/imagenilustrativa.jpg';
      const linkBtn = p.esLinkEspecial && p.url
        ? `<a href="${p.url}" target="_blank" class="nav-btn active" style="width: 100%; justify-content: center; text-decoration: none; background: var(--blue-mid); color: white;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver en Amazon</a>`
        : `<button class="nav-btn active" style="width: 100%; justify-content: center;" onclick="agregarAlCarrito(${p.id})"><i class="fa-solid fa-cart-plus"></i> Añadir al Carrito</button>`;
      
      card.innerHTML = `
        ${badge}
        <img src="${imgSrc}" alt="${p.nombre}" onerror="this.src='ASSETS/imagenilustrativa.jpg'">
        <div class="producto-info">
          <h3>${p.nombre}</h3>
          <p style="font-size: 1.2rem; font-weight: 800; color: var(--blue-mid); margin-bottom: 15px;">${p.precio > 0 ? 'Q' + p.precio : 'Precio a cotizar'}</p>
          ${linkBtn}
        </div>
      `;
      card.style.position = 'relative';
      contenedor.appendChild(card);
    });

  } catch(e) {
    console.error("Error cargando productos:", e);
    contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: #EF4444;">Error al cargar los productos. Verifica tu conexión.</div>';
  }
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
