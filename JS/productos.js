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
