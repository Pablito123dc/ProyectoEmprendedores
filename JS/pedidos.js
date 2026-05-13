// Calcular fecha de entrega estimada
function calcularFechaEntrega() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 7);
  return fecha.toLocaleDateString('es-GT');
}

// Generar código único de pedido
function generarCodigoPedido() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = Math.floor(1000 + Math.random() * 9000);
  const letra1 = letras[Math.floor(Math.random() * letras.length)];
  const letra2 = letras[Math.floor(Math.random() * letras.length)];
  return `GT-${letra1}${letra2}${nums}`;
}

// Crear pedido y guardarlo en Firebase
async function crearPedido() {
  const carrito = obtenerCarrito();

  if (carrito.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  const usuario = typeof obtenerUsuarioActual !== 'undefined' ? obtenerUsuarioActual() : null;
  if (!usuario) {
    alert("Sesión inválida. Por favor inicia sesión.");
    return;
  }

  const codigoPedido = generarCodigoPedido();

  const nuevoPedido = {
    id: Date.now(),
    codigo: codigoPedido,
    productos: carrito,
    estado: "Recibido — Pendiente de Compra",
    fechaEntrega: calcularFechaEntrega(),
    fechaPedido: new Date().toISOString(),
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      telefono: usuario.telefono || '',
      direccion: usuario.direccion || ''
    }
  };

  try {
    await db.collection("pedidos").add(nuevoPedido);
  } catch(e) {
    console.error(e);
    alert("Ocurrió un error al enviar tu pedido. Revisa tu conexión.");
    return;
  }

  // Mensaje WhatsApp para los admins
  let total = 0;
  let hayCotizaciones = false;
  let mensaje = `🛒 *NUEVO PEDIDO — Importaciones GT*\n`;
  mensaje += `📋 *Código:* ${codigoPedido}\n`;
  mensaje += `👤 *Cliente:* ${usuario.nombre}\n`;
  mensaje += `📧 *Correo:* ${usuario.correo}\n`;
  mensaje += `📞 *Tel:* ${usuario.telefono || 'No indicado'}\n`;
  mensaje += `🏠 *Dirección:* ${usuario.direccion || 'No indicada'}\n\n`;
  mensaje += `*Productos Solicitados:*\n`;

  carrito.forEach(p => {
    if (p.esLinkEspecial) {
      mensaje += `🔍 COTIZACIÓN AMAZON:\n   ${p.descripcion}\n`;
      hayCotizaciones = true;
    } else {
      mensaje += `📦 ${p.nombre} — Q${p.precio}\n`;
      total += p.precio;
    }
  });

  mensaje += `\n*TOTAL APROX: Q${total}*`;
  if (hayCotizaciones) mensaje += ` _(+ cotizaciones pendientes)_`;
  mensaje += `\n\nFavor confirmar disponibilidad. Gracias.`;

  // Limpiar carrito
  localStorage.removeItem(DB_CARRITO);

  // Mostrar código al usuario
  const modalHtml = `
    <div id="modal-pedido-ok" style="
      position: fixed; inset: 0; background: rgba(15,23,42,0.85);
      display: flex; align-items: center; justify-content: center;
      z-index: 99999; backdrop-filter: blur(8px);
    ">
      <div style="
        background: white; border-radius: 24px; padding: 40px;
        max-width: 420px; width: 90%; text-align: center;
        box-shadow: 0 30px 60px rgba(0,0,0,0.3);
        animation: fadeInUp 0.4s ease;
      ">
        <div style="font-size: 3rem; margin-bottom: 15px;">🎉</div>
        <h2 style="color: #0B1C3E; margin: 0 0 10px;">¡Pedido Confirmado!</h2>
        <p style="color: #5A6F8E; margin-bottom: 25px; font-size: 0.95rem;">
          Tu pedido fue recibido y nuestro equipo lo procesará pronto.
        </p>
        <div style="
          background: #F0F7FF; border: 2px dashed #2B5DAD;
          border-radius: 16px; padding: 20px; margin-bottom: 25px;
        ">
          <p style="margin: 0 0 5px; font-size: 0.8rem; color: #5A6F8E; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Tu Código de Pedido</p>
          <p style="margin: 0; font-size: 2rem; font-weight: 900; color: #2B5DAD; letter-spacing: 3px;">${codigoPedido}</p>
          <p style="margin: 8px 0 0; font-size: 0.8rem; color: #5A6F8E;">Guárdalo para rastrear tu pedido</p>
        </div>
        <p style="font-size: 0.85rem; color: #5A6F8E; margin-bottom: 20px;">
          📩 Entrega estimada: <strong>${nuevoPedido.fechaEntrega}</strong>
        </p>
        <div style="display: flex; gap: 10px; flex-direction: column;">
          <button onclick="
            window.open('https://wa.me/50240805665?text=${encodeURIComponent(mensaje)}', '_blank');
            document.getElementById('modal-pedido-ok').remove();
            if(typeof mostrarCarrito === 'function') mostrarCarrito();
          " style="
            background: #25D366; color: white; border: none;
            padding: 14px; border-radius: 12px; font-size: 1rem;
            font-weight: 700; cursor: pointer; display: flex;
            align-items: center; justify-content: center; gap: 8px;
          ">
            <i class="fa-brands fa-whatsapp"></i> Confirmar por WhatsApp
          </button>
          <button onclick="
            document.getElementById('modal-pedido-ok').remove();
            if(typeof mostrarCarrito === 'function') mostrarCarrito();
          " style="
            background: #F1F5F9; color: #5A6F8E; border: none;
            padding: 12px; border-radius: 12px; font-size: 0.9rem;
            cursor: pointer;
          ">Cerrar</button>
        </div>
      </div>
    </div>
    <style>
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  if (typeof mostrarCarrito === "function") mostrarCarrito();
}

// Mostrar pedidos del usuario desde Firebase
async function mostrarPedidos() {
  const contenedor = document.getElementById("pedidos");
  const usuario = typeof obtenerUsuarioActual !== 'undefined' ? obtenerUsuarioActual() : null;

  if (!usuario) return;

  contenedor.innerHTML = "<div class='empty-state'><i class='fa-solid fa-spinner fa-spin fa-3x' style='color:#3B82F6'></i><br>Buscando tus pedidos...</div>";

  try {
    const snapshot = await db.collection("pedidos").get();
    const pedidos = [];
    snapshot.forEach(doc => {
      let p = doc.data();
      if (p.usuario && p.usuario.correo === usuario.correo) {
        pedidos.push(p);
      }
    });

    if (pedidos.length === 0) {
      contenedor.innerHTML = "<div class='empty-state'><i class='fa-solid fa-clipboard-list fa-3x' style='margin-bottom: 20px; color: #CBD5E1'></i><br>Aún no tienes pedidos. ¡Anímate a cotizar!</div>";
      return;
    }

    let html = "";
    pedidos.forEach(p => {
      html += `
        <div class="producto">
          <div style="font-size: 2rem; color: #3B82F6; margin-bottom: 10px;"><i class="fa-solid fa-truck-fast"></i></div>
          <h3>Pedido #${p.codigo || p.id}</h3>
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