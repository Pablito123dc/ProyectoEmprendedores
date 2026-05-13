const API_KEY_RAINFOREST = "E4D41E73E3344211A706CC7F2A3A1C1F";
const API_BASE = "https://api.rainforestapi.com/request";
const LLAVE_MAESTRA = "GT2026"; // Esta es tu clave secreta para crear admins

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
  const imagen = document.getElementById("prod-imagen").value;

  if (!nombre || !desc || !precio) {
    alert("Por favor llena todos los campos obligatorios");
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
    precio: parseFloat(precio),
    imagen: imagen || ""
  };

  await crearProducto(nuevo); // function inside productos.js
  
  alert("¡Producto añadido al catálogo global de Firebase!");
  document.getElementById("prod-nombre").value = "";
  document.getElementById("prod-desc").value = "";
  document.getElementById("prod-precio").value = "";
  document.getElementById("prod-imagen").value = "";

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
      let mediaHtml = p.imagen 
        ? `<div style="height: 120px; border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:15px; background: white;"><img src="${p.imagen}" style="max-height:100%; max-width:100%; object-fit:contain;"></div>` 
        : `<div style="font-size: 3rem; color: #94A3B8; margin-bottom: 15px;"><i class="fa-solid fa-gift"></i></div>`;

      html += `
        <div class="producto">
          ${mediaHtml}
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

async function sincronizarOfertasAmazon() {
  if(!confirm("¿Deseas sincronizar los productos destacados de hoy desde el servidor internacional?")) return;

  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Conectando con Amazon Global...';
  btn.disabled = true;

  try {
    const params = new URLSearchParams({
      api_key: API_KEY_RAINFOREST,
      type: 'search',
      amazon_domain: 'amazon.com',
      search_term: 'deals of the day'
    });

    const targetUrl = `${API_BASE}?${params.toString()}`;
    // Usamos un proxy para evitar bloqueos de CORS en GitHub Pages
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxyUrl);
    const proxyData = await response.json();
    
    // AllOrigins devuelve la respuesta dentro de .contents como string
    const data = JSON.parse(proxyData.contents);

    if (!data.search_results) {
      throw new Error("No se obtuvieron resultados de búsqueda");
    }

    // Limpiar ofertas viejas en Firebase
    const oldOffers = await db.collection("ofertas").get();
    const batch = db.batch();
    oldOffers.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Guardar nuevas ofertas (tomamos las primeras 8 para no saturar)
    const newOffers = data.search_results.slice(0, 8);
    for (const item of newOffers) {
      await db.collection("ofertas").add({
        id: Date.now() + Math.random(),
        nombre: item.title,
        descripcion: "Oferta de Amazon — Enlace directo",
        precio: item.price ? Math.ceil(item.price.value * 8.5) : 0, // Conversión aprox + comisión
        imagen: item.image,
        url: item.link,
        esOferta: true
      });
    }

    alert("¡Éxito! El catálogo internacional ha sido actualizado correctamente.");
    
  } catch (error) {
    console.error("Error detallado del robot:", error);
    if (error.message.includes("402")) {
      alert("Error: Los tokens de la API se han agotado. Revisa tu cuenta en Rainforest API.");
    } else {
      alert("Error al conectar con el robot. Asegúrate de tener conexión a internet o revisa si tu API KEY es correcta.");
    }
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Función para cerrar sesión y bloquear el panel
function cerrarSesionAdmin() {
  if (confirm("¿Estás seguro de que deseas salir del panel de administración?")) {
    localStorage.removeItem('sesion_admin');
    alert("Sesión de administrador cerrada.");
    location.reload(); // Esto activa el muro de seguridad de nuevo
  }
}

// ── SEGURIDAD DE ADMINISTRADOR ──

function mostrarRegistroAdmin(show) {
  document.getElementById('admin-login-fields').style.display = show ? 'none' : 'block';
  document.getElementById('admin-register-fields').style.display = show ? 'block' : 'none';
}

async function registrarNuevoAdmin() {
  const nombre = document.getElementById('admin-reg-nombre').value;
  const email = document.getElementById('admin-reg-email').value;
  const pass = document.getElementById('admin-reg-pass').value;
  const secret = document.getElementById('admin-reg-secret').value;

  if (!nombre || !email || !pass || !secret) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  if (secret !== LLAVE_MAESTRA) {
    alert("CÓDIGO SECRETO INCORRECTO. No tienes permiso para crear cuentas de dueño.");
    return;
  }

  try {
    const exist = await db.collection('usuarios').where('correo', '==', email).get();
    if (!exist.empty) {
      alert("Ya existe un usuario con este correo.");
      return;
    }

    const nuevoAdmin = {
      nombre,
      correo: email,
      pass,
      rol: 'admin',
      id: Date.now()
    };

    await db.collection('usuarios').add(nuevoAdmin);
    alert("¡Dueño registrado con éxito! Ahora puedes iniciar sesión.");
    mostrarRegistroAdmin(false);
  } catch (e) {
    console.error("Error detallado de Firebase:", e);
    alert("Error al registrar dueño: " + e.message + "\n\nVerifica que hayas activado 'Firestore Database' en tu consola de Firebase y que las reglas estén en 'Modo de prueba'.");
  }
}

async function validarAccesoAdmin() {
  const email = document.getElementById('admin-email').value;
  const pass = document.getElementById('admin-pass').value;

  if (!email || !pass) {
    alert("Ingresa tus credenciales de dueño.");
    return;
  }

  try {
    const query = await db.collection('usuarios')
      .where('correo', '==', email)
      .where('pass', '==', pass)
      .where('rol', '==', 'admin')
      .get();

    if (query.empty) {
      alert("Credenciales incorrectas o no tienes permisos de dueño.");
      return;
    }

    let user = null;
    query.forEach(doc => user = doc.data());

    localStorage.setItem("sesion_admin", JSON.stringify(user));
    entrarAlPanel();
  } catch (e) {
    console.error(e);
    alert("Error de conexión con el servidor: " + e.message);
  }
}

function entrarAlPanel() {
  document.getElementById('admin-auth-barrier').style.display = 'none';
  const content = document.getElementById('admin-content');
  content.style.opacity = '1';
  content.style.pointerEvents = 'auto';
  renderAdminProductos();
}

function verificarSesionAdmin() {
  const sesion = JSON.parse(localStorage.getItem("sesion_admin"));
  if (sesion && sesion.rol === 'admin') {
    entrarAlPanel();
  }
}

window.onload = function() {
  verificarSesionAdmin();
}
