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

// FUNCIONES DEL PANEL ADMINISTRATIVO
function verificarAdmin() {
  let pass = document.getElementById("admin-pass-input").value;
  if (pass === PASSWORD_ADMIN) {
    document.getElementById("admin-login-box").style.display = "none";
    document.getElementById("admin-dashboard").style.display = "block";
    alert("¡Acceso concedido al panel administrativo de MÓEVA!");
  } else {
    alert("Contraseña incorrecta. (Prueba con: moeva2026)");
  }
}

function cerrarAdmin() {
  document.getElementById("admin-login-box").style.display = "block";
  document.getElementById("admin-dashboard").style.display = "none";
  document.getElementById("admin-pass-input").value = "";
}

function cambiarTabAdmin(tabName) {
  let tabs = document.querySelectorAll(".admin-tab-content");
  tabs.forEach(t => t.style.display = "none");

  let botones = document.querySelectorAll(".admin-tabs .tab-btn");
  botones.forEach(b => b.classList.remove("active"));

  if (tabName === 'alumnas') {
    document.getElementById("tab-alumnas").style.display = "block";
  } else if (tabName === 'reservas') {
    document.getElementById("tab-reservas").style.display = "block";
  } else if (tabName === 'clases') {
    document.getElementById("tab-clases").style.display = "block";
  } else if (tabName === 'pagos') {
    document.getElementById("tab-pagos").style.display = "block";
  }

  event.currentTarget.classList.add("active");
}

function agregarAlumnaPrompt() {
  let nombre = prompt("Nombre completo de la nueva alumna:");
  if (nombre) {
    let email = prompt("Correo electrónico:");
    let tbody = document.getElementById("tabla-alumnas-body");
    let nuevaFila = document.createElement("tr");
    nuevaFila.innerHTML = `
      <td>${nombre}</td>
      <td>${email || 'Sin correo'}</td>
      <td>Nuevo Ingreso</td>
      <td><button class="btn-accion">Editar</button></td>
    `;
    tbody.appendChild(nuevaFila);
    alert("¡Alumna agregada exitosamente al sistema!");
  }
}

window.onload = function() {
  let nombreGuardado = localStorage.getItem("moeva_usuario_nombre");
  let emailGuardado = localStorage.getItem("moeva_usuario_email");
  if (nombreGuardado && emailGuardado) {
    mostrarPerfil(nombreGuardado, emailGuardado);
  }
};
