const PASSWORD_ADMIN = "moeva2026";

function crearCuenta(event) {
  event.preventDefault();
  let nombre = document.getElementById("reg-nombre").value;
  let email = document.getElementById("reg-email").value;

  localStorage.setItem("moeva_usuario_nombre", nombre);
  localStorage.setItem("moeva_usuario_email", email);

  alert(`¡Cuenta creada con éxito! Bienvenida a MÓEVA, ${nombre}.`);
  mostrarPerfil(nombre, email);
}

function mostrarPerfil(nombre, email) {
  document.getElementById("form-registro-container").style.display = "none";
  document.getElementById("vista-perfil").style.display = "block";
  document.getElementById("perfil-nombre-txt").innerText = nombre;
  document.getElementById("perfil-email-txt").innerText = email;
}

function abrirPerfil(event) {
  event.preventDefault();
  let nombreGuardado = localStorage.getItem("moeva_usuario_nombre");
  let emailGuardado = localStorage.getItem("moeva_usuario_email");

  if (nombreGuardado && emailGuardado) {
    mostrarPerfil(nombreGuardado, emailGuardado);
  } else {
    document.getElementById("form-registro-container").style.display = "block";
    document.getElementById("vista-perfil").style.display = "none";
  }
  window.location.hash = "#reservas";
}

function cerrarSesion() {
  localStorage.removeItem("moeva_usuario_nombre");
  localStorage.removeItem("moeva_usuario_email");
  document.getElementById("form-registro-container").style.display = "block";
  document.getElementById("vista-perfil").style.display = "none";
  alert("Has cerrado sesión correctamente.");
}

function accesoAdmin() {
  let password = prompt("Ingresa la contraseña de administrador:");
  if (password === PASSWORD_ADMIN) {
    alert("¡Acceso concedido! Bienvenido al panel de control de MÓEVA.");
  } else if (password !== null) {
    alert("Contraseña incorrecta.");
  }
}

window.onload = function() {
  let nombreGuardado = localStorage.getItem("moeva_usuario_nombre");
  let emailGuardado = localStorage.getItem("moeva_usuario_email");
  if (nombreGuardado && emailGuardado) {
    mostrarPerfil(nombreGuardado, emailGuardado);
  }
};
