function mostrarVistaAdmin(vista) {
  document.getElementById("admin-productos").style.display = "none";
  document.getElementById("admin-pedidos").style.display = "none";

  document.getElementById(vista).style.display = "block";

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('btn-' + vista).classList.add('active');

  if (vista === "admin-productos") renderAdminProductos();
  if (vista === "admin-pedidos") renderAdminPedidos();
}

async function guardarNuevoProducto() {
  const nombre = document.getElementById("prod-nombre").value;
  const desc = document.getElementById("prod-desc").value;
  const precio = document.getElementById("prod-precio").value;

  if (!nombre || !desc || !precio) {
    alert("Por favor llena todos los campos");
    return;
  }

  // Prevenir dobles clics
  const btnAct = event.currentTarget || document.activeElement;
  const initText = btnAct.innerHTML;
  btnAct.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Subiendo a la nube...";
  btnAct.disabled = true;

  const nuevo = {
    nombre: nombre,
    descripcion: desc,
    precio: parseFloat(precio)
  };

  await crearProducto(nuevo); // function inside productos.js
  
  alert("¡Producto añadido al catálogo global de Firebase!");
  document.getElementById("prod-nombre").value = "";
  document.getElementById("prod-desc").value = "";
  document.getElementById("prod-precio").value = "";

  btnAct.innerHTML = initText;
  btnAct.disabled = false;

  renderAdminProductos();
}

async function eliminarProducto(firebaseId) {
  if(!confirm("¿Seguro que deseas eliminar permanentemente este artículo de la tienda pública?")) return;
  
  try {
    await db.collection("productos").doc(firebaseId).delete();
    renderAdminProductos();
  } catch(e) {
    console.error(e);
    alert("Hubo un error borrando el producto en Firebase.");
  }
}

async function renderAdminProductos() {
  const contenedor = document.getElementById("lista-admin-productos");
  contenedor.innerHTML = "<div class='empty-state'><i class='fa-solid fa-spinner fa-spin fa-3x' style='color:#3B82F6; margin-bottom:20px;'></i><br>Cargando productos del servidor global...</div>";

  try {
    const snapshot = await db.collection("productos").get();
    const productos = [];
    snapshot.forEach(doc => productos.push({ firebaseId: doc.id, ...doc.data() }));

    if (productos.length === 0) {
      contenedor.innerHTML = "<div class='empty-state'>El catálogo de la nube está vacío. Usa el formulario de arriba para añadir un producto oficial.</div>";
      return;
    }

    let html = "";
    productos.forEach(p => {
      html += `
        <div class="producto">
          <div style="font-size: 3rem; color: #94A3B8; margin-bottom: 15px;"><i class="fa-solid fa-gift"></i></div>
          <h3>${p.nombre}</h3>
          <p>${p.descripcion}</p>
          <p class="precio">Q${p.precio}</p>
          <button class="btn-delete" onclick="eliminarProducto('${p.firebaseId}')"><i class="fa-solid fa-trash-can"></i> Eliminar del Servidor</button>
        </div>
      `;
    });
    
    contenedor.innerHTML = html;
  } catch(e) {
     console.error(e);
     contenedor.innerHTML = "<div class='empty-state' style='color:#EF4444'>Error sincronizando productos con la nube. Revisa tu conexión.</div>";
  }
}

async function vaciarTodosLosPedidos() {
  if(!confirm("⚠️ ¿Estás 100% seguro de eliminar el registro de base de datos entero sobre las compras de clientes en el mundo? No podrás recuperarlo.")) return;
  
  try {
    const snap = await db.collection("pedidos").get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    renderAdminPedidos();
  } catch(e) {
    console.error(e);
    alert("Error al borrar los pedidos masivamente de Firebase.");
  }
}

async function renderAdminPedidos() {
  const contenedor = document.getElementById("lista-admin-pedidos");
  contenedor.innerHTML = "<div class='empty-state'><i class='fa-solid fa-spinner fa-spin fa-3x' style='color:#3B82F6; margin-bottom:20px;'></i><br>Descargando el historial global desde Firebase...</div>";

  try {
    const snapshot = await db.collection("pedidos").get();
    const pedidos = [];
    snapshot.forEach(doc => pedidos.push({ firebaseId: doc.id, ...doc.data() }));

    if (pedidos.length === 0) {
      contenedor.innerHTML = "<div class='empty-state'><i class='fa-solid fa-inbox fa-3x' style='margin-bottom: 20px; color: #CBD5E1'></i><br>Nadie ha realizado compras a nivel global aún.</div>";
      return;
    }

    // Agrupar pedidos
    const pedidosAgrupados = {};
    pedidos.forEach(p => {
      const correo = p.usuario && p.usuario.correo ? p.usuario.correo : "Sin correo";
      const telefono = p.usuario && p.usuario.telefono ? p.usuario.telefono : "Sin teléfono";
      const nombre = p.usuario && p.usuario.nombre ? p.usuario.nombre : "Cliente Fantasma";
      const direccion = p.usuario && p.usuario.direccion ? p.usuario.direccion : "Sin dirección";
      
      if(!pedidosAgrupados[correo]) {
        pedidosAgrupados[correo] = { nombre, telefono, correo, direccion, ordenes: [] };
      }
      pedidosAgrupados[correo].ordenes.push(p);
    });

    let html = "";
    for (const uid in pedidosAgrupados) {
      const grupo = pedidosAgrupados[uid];
      
      let ordenesHtml = "";
      grupo.ordenes.forEach(p => {
          let prodsHtml = p.productos.map(prod => {
             if (prod.esLinkEspecial) return `<li>🔍 Cotización Link Externa: <a href="${prod.descripcion}" target="_blank" style="color:var(--primary-color); text-decoration:none; font-weight:600;">[Abrir Enlace Comercial]</a></li>`;
             return `<li>${prod.nombre} (Q${prod.precio})</li>`;
          }).join("");

          ordenesHtml += `
            <div style="background:var(--bg-color); padding: 15px; border-radius: 10px; margin-bottom: 10px;">
              <h4 style="margin:0 0 10px 0; color:var(--primary-color);">Pedido #${p.id} <span style="float:right; font-size:0.8rem;" class="tag-estado">${p.estado}</span></h4>
              <p style="margin:5px 0;"><strong>Fecha est.:</strong> ${p.fechaEntrega}</p>
              <ul style="padding-left:20px; font-size:0.9rem; color:var(--text-muted); margin:0;">
                ${prodsHtml}
              </ul>
            </div>
          `;
      });

      html += `
        <div class="producto" style="text-align:left; display:block; padding: 20px;">
          <h3 style="color:var(--text-dark); margin-top:0; font-size: 1.5rem;"><i class="fa-solid fa-user"></i> ${grupo.nombre}</h3>
          <div style="margin-bottom: 15px;">
            <p style="color:var(--text-muted); margin-bottom:5px; margin-top:0;"><i class="fa-solid fa-envelope"></i> ${grupo.correo}</p>
            <p style="color:var(--text-muted); margin-bottom:5px; margin-top:0;"><i class="fa-solid fa-phone"></i> ${grupo.telefono}</p>
            <p style="color:var(--text-muted); margin-top:0;"><i class="fa-solid fa-map-location-dot"></i> ${grupo.direccion}</p>
          </div>
          <hr style="border:0; border-top:1px solid #E5E7EB; margin:15px 0;">
          ${ordenesHtml}
        </div>
      `;
    }
    
    contenedor.innerHTML = html;

  } catch(e) {
    console.error(e);
    contenedor.innerHTML = "<div class='empty-state' style='color:#EF4444'>Error sincronizando pedidos con la nube. Verifica tu conexión a internet o los permisos de Firebase.</div>";
  }
}

window.onload = function() {
  renderAdminProductos();
}
