const DB_SESION = "sesion_actual";

function obtenerUsuarioActual() {
  return JSON.parse(localStorage.getItem(DB_SESION)) || null;
}

let accionPendiente = null;

function verificarAutenticacion(callback) {
  const usuario = obtenerUsuarioActual();
  if (usuario) {
    if (callback) callback();
  } else {
    accionPendiente = callback;
    document.getElementById('auth-modal').style.display = 'flex';
    toggleAuth(false);
  }
}

function toggleAuth(showRegistro) {
    document.getElementById('view-login').style.display = showRegistro ? 'none' : 'block';
    document.getElementById('view-registro').style.display = showRegistro ? 'block' : 'none';
}

async function procesarLogin() {
  const correo = document.getElementById('login-correo').value;
  const pass = document.getElementById('login-pass').value;

  if (!correo || !pass) {
    alert("Por favor llena ambos campos para iniciar sesión.");
    return;
  }

  const resultBox = document.createElement("p");
  resultBox.id = "cargando-auth";
  resultBox.innerText = "Conectando a la nube...";
  document.getElementById('view-login').appendChild(resultBox);
  
  try {
    const query = await db.collection('usuarios')
      .where('correo', '==', correo)
      .where('pass', '==', pass)
      .get();
    
    document.getElementById('cargando-auth').remove();

    if (query.empty) {
      alert("Correo o contraseña incorrectos.");
      return;
    }

    let usuarioEncontrado = null;
    query.forEach(doc => { usuarioEncontrado = doc.data(); });

    localStorage.setItem(DB_SESION, JSON.stringify(usuarioEncontrado));
    cerrarModalYContinuar();

  } catch (error) {
    console.error("Error conectando a Firebase:", error);
    if(document.getElementById('cargando-auth')) document.getElementById('cargando-auth').remove();
    alert("Error de red. Intenta de nuevo.");
  }
}

async function procesarRegistro() {
  const nombre = document.getElementById('reg-nombre').value;
  const telefono = document.getElementById('reg-telefono').value;
  const correo = document.getElementById('reg-correo').value;
  const direccion = document.getElementById('reg-direccion').value;
  const pass = document.getElementById('reg-pass').value;

  if (!nombre || !telefono || !correo || !direccion || !pass) {
    alert("Todos los campos son obligatorios para el registro.");
    return;
  }

  const resultBox = document.createElement("p");
  resultBox.id = "cargando-auth-reg";
  resultBox.innerText = "Comprobando disponibilidad...";
  document.getElementById('view-registro').appendChild(resultBox);

  try {
    const exist = await db.collection('usuarios').where('correo', '==', correo).get();
    
    if (!exist.empty) {
      alert("Ya existe una cuenta vinculada a este correo.");
      document.getElementById('cargando-auth-reg').remove();
      return;
    }
    
    let nuevoUsuario = { 
        id: Date.now(), 
        nombre, 
        telefono, 
        correo, 
        direccion, 
        pass 
    };
    
    await db.collection('usuarios').add(nuevoUsuario);
    localStorage.setItem(DB_SESION, JSON.stringify(nuevoUsuario));

    document.getElementById('cargando-auth-reg').remove();
    cerrarModalYContinuar();

  } catch(e) {
    console.error(e);
    if(document.getElementById('cargando-auth-reg')) document.getElementById('cargando-auth-reg').remove();
    alert("Hubo un error al crear tu cuenta. Revisa tu conexión.");
  }
}

function cerrarModalYContinuar() {
  document.getElementById('auth-modal').style.display = 'none';
  actualizarUIAuth();
  
  if (accionPendiente) {
    accionPendiente();
    accionPendiente = null;
  }
}

function cerrarSesion() {
  localStorage.removeItem(DB_SESION);
  actualizarUIAuth();
  alert("Sesión cerrada correctamente.");
  setTimeout(() => { if(typeof ejecutarCambioVista === 'function') ejecutarCambioVista('catalogo'); }, 100);
}

function actualizarUIAuth() {
  const usuario = obtenerUsuarioActual();
  const btnLogout = document.getElementById("btn-logout");
  const badge = document.getElementById("user-profile-badge");
  
  if(usuario) {
    if(btnLogout) btnLogout.style.display = "flex";
    if(badge) {
      badge.style.display = "flex";
      document.getElementById("user-name-display").innerText = usuario.nombre;
      // Toma la primera letra del nombre
      document.getElementById("user-initial").innerText = usuario.nombre.charAt(0).toUpperCase();
    }
  } else {
    if(btnLogout) btnLogout.style.display = "none";
    if(badge) badge.style.display = "none";
  }
}

function togglePasswordVisibility(inputId, iconElement) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    iconElement.classList.remove('fa-eye');
    iconElement.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    iconElement.classList.remove('fa-eye-slash');
    iconElement.classList.add('fa-eye');
  }
}

window.addEventListener('load', actualizarUIAuth);
