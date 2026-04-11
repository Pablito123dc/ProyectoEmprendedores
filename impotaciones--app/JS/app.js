function mostrarVista(vista) {
  if (vista === "carrito" || vista === "pedidos") {
    verificarAutenticacion(() => {
      ejecutarCambioVista(vista);
    });
  } else {
    ejecutarCambioVista(vista);
  }
}

function ejecutarCambioVista(vista) {
  document.getElementById("cotizacion-link").style.display = (vista === 'catalogo') ? "block" : "none";
  document.getElementById("catalogo").style.display = "none";
  document.getElementById("carrito").style.display = "none";
  document.getElementById("pedidos").style.display = "none";

  document.getElementById(vista).style.display = "grid";

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('btn-' + vista).classList.add('active');

  if (vista === "catalogo") mostrarProductos();
  if (vista === "carrito") mostrarCarrito();
  if (vista === "pedidos") mostrarPedidos();
}

window.onload = function() {
  mostrarProductos();
}