// Calcular fecha de entrega
function calcularFechaEntrega() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 7);
  return fecha.toLocaleDateString();
}

// Crear pedido y enviar a Firebase
async function crearPedido() {
  const carrito = obtenerCarrito();
  
  if (carrito.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  const usuario = typeof obtenerUsuarioActual !== 'undefined' ? obtenerUsuarioActual() : null;
  if (!usuario) { alert("Sesión inválida"); return; }

  const nuevoPedido = {
    id: Date.now(),
    productos: carrito,
    estado: "En envío (En el barco)",
    fechaEntrega: calcularFechaEntrega(),
    usuario: usuario 
  };

  try {
    // Almacenarlo permanentemente en Firebase
    await db.collection("pedidos").add(nuevoPedido);
  } catch(e) {
    console.error(e);
    alert("Ocurrió un error al enviar tu pedido a la nube. Revisa tu conexión a internet.");
    return;
  }

  // Construir el mensaje de envío
  let total = 0;
  let hayCotizacionesLink = false;
  let nombreUsr = usuario ? usuario.nombre : "Cliente";
  let mensaje = `Hola Importaciones GT, soy ${nombreUsr}. Me gustaría realizar la siguiente compra (Ref: #${nuevoPedido.id}):\n\n`;
  
  carrito.forEach(p => {
    if (p.esLinkEspecial) {
      mensaje += `- 🔍 COTIZACIÓN DE LINK EXTERNO:\n  ${p.descripcion}\n`;
      hayCotizacionesLink = true;
    } else {
      mensaje += `- ${p.nombre} (Q${p.precio})\n`;
      total += p.precio;
    }
  });

  mensaje += `\n*SUBTOTAL APROXIMADO: Q${total}* ${hayCotizacionesLink ? '(A falta de tasar los links externos)' : ''}\n`;
  mensaje += `\nEspero la confirmación del proveedor local.`;

  // Mandar WhatsApp
  const numeroWhatsApp = "50200000000"; 
  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  
  localStorage.removeItem(DB_CARRITO); // Defined inside carrito.js

  alert("Todo listo ✔. El pedido ya se guardó y recibirás confirmación vía WhatsApp.");
  window.open(linkWhatsApp, '_blank');

  if (typeof mostrarCarrito === "function") mostrarCarrito();
}

// Obtener pedidos de un usuario desde Firebase
async function mostrarPedidos() {
  const contenedor = document.getElementById("pedidos");
  const usuario = typeof obtenerUsuarioActual !== 'undefined' ? obtenerUsuarioActual() : null;

  if (!usuario) return;

  contenedor.innerHTML = "<div class='empty-state'><i class='fa-solid fa-spinner fa-spin fa-3x' style='color:#3B82F6'></i><br>Buscando tus pedidos globales...</div>";

  try {
    // Puedes mejorar esto poniendo index de Firebase, o haciendo filter local
    const snapshot = await db.collection("pedidos").get();
    const pedidos = [];
    snapshot.forEach(doc => {
      let p = doc.data();
      if(p.usuario && p.usuario.correo === usuario.correo) {
         pedidos.push(p);
      }
    });

    if (pedidos.length === 0) {
      contenedor.innerHTML = "<div class='empty-state'><i class='fa-solid fa-clipboard-list fa-3x' style='margin-bottom: 20px; color: #CBD5E1'></i><br>Aún no realizas ninguna compra. Anímate.</div>";
      return;
    }

    let html = "";
    pedidos.forEach(p => {
      html += `
        <div class="producto">
          <div style="font-size: 2rem; color: #3B82F6; margin-bottom: 10px;"><i class="fa-solid fa-truck-fast"></i></div>
          <h3>Pedido #${p.id}</h3>
          <div><span class="tag-estado"><i class="fa-solid fa-circle-notch fa-spin"></i> ${p.estado}</span></div>
          <div><span class="tag-fecha"><i class="fa-regular fa-calendar-check"></i> Entrega Aprox: ${p.fechaEntrega}</span></div>
        </div>
      `;
    });
    
    contenedor.innerHTML = html;
  } catch (error) {
    console.error(error);
    contenedor.innerHTML = "<div class='empty-state'>Error al descargar pedidos. Contacta al admin.</div>";
  }
}