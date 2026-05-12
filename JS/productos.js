// Obtener productos desde Firebase
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

// Crear producto en Firebase
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

// Mostrar catálogo (Para el cliente)
async function mostrarProductos() {
  const contenedor = document.getElementById("catalogo");
  contenedor.innerHTML = "<div class='empty-state'><i class='fa-solid fa-spinner fa-spin fa-3x' style='margin-bottom: 20px; color: #3B82F6'></i><br>Cargando el catálogo en vivo...</div>";

  const productos = await obtenerProductos();

  if (productos.length === 0) {
    contenedor.innerHTML = "<div class='empty-state'><i class='fa-solid fa-box-open fa-3x' style='margin-bottom: 20px; color: #CBD5E1'></i><br>No hay productos disponibles por ahora</div>";
    return;
  }

  // Guardamos un caché temporal de productos para que AgregarAlCarrito sea más rápido
  window.cacheProductos = productos;

  let html = "";
  productos.forEach(p => {
    let mediaHtml = p.imagen 
      ? `<div style="height: 140px; border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:15px; background: white;"><img src="${p.imagen}" style="max-height:100%; max-width:100%; object-fit:contain; border-radius:10px;"></div>` 
      : `<div style="font-size: 3rem; color: #94A3B8; margin-bottom: 15px;"><i class="fa-solid fa-gift"></i></div>`;

    html += `
      <div class="producto">
        ${mediaHtml}
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <p class="precio">Q${p.precio}</p>
        <button onclick="agregarAlCarrito(${p.id})"><i class="fa-solid fa-cart-plus"></i> Solicitar importación</button>
      </div>
    `;
  });
  
  contenedor.innerHTML = html;
}