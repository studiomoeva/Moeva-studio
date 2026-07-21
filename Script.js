// SCRIPT FUNCIONAL MOÉVA - GESTIÓN COMPLETA DE ALUMNAS, CRÉDITOS Y ADMIN

function registrarAlumna(event) {
  event.preventDefault();
  let nombre = document.getElementById("input-nombre").value;
  let email = document.getElementById("input-email").value;

  localStorage.setItem("moeva_nombre", nombre);
  localStorage.setItem("moeva_email", email);
  localStorage.setItem("moeva_creditos", "6");
  localStorage.setItem("moeva_clase_agendada", "Ninguna");

  cargarDashboardAlumna(nombre, 6, "Ninguna");
}

function cargarDashboardAlumna(nombre, creditos, claseAgendada) {
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("dashboard-alumna").style.display = "block";
  document.getElementById("lbl-nombre-usuario").innerText = nombre;
  document.getElementById("lbl-creditos").innerText = creditos;
  document.getElementById("lbl-clase-reservada").innerText = claseAgendada;
  
  if(claseAgendada && claseAgendada !== "Ninguna") {
    document.getElementById("mensaje-reserva").innerText = "✔ Tu clase reservada actual es: " + claseAgendada;
  } else {
    document.getElementById("mensaje-reserva").innerText = "";
  }
}

function abrirPerfil(event) {
  event.preventDefault();
  let nombre = localStorage.getItem("moeva_nombre");
  let creditos = localStorage.getItem("moeva_creditos") || "6";
  let claseAgendada = localStorage.getItem("moeva_clase_agendada") || "Ninguna";

  if (nombre) {
    cargarDashboardAlumna(nombre, creditos, claseAgendada);
  } else {
    document.getElementById("auth-container").style.display = "block";
    document.getElementById("dashboard-alumna").style.display = "none";
  }
  window.location.hash = "#perfil";
}

function agendarClase() {
  let creditos = parseInt(localStorage.getItem("moeva_creditos") || "6");
  if(creditos <= 0) {
    alert("No tienes créditos disponibles. Adquiere un nuevo paquete para reservar.");
    return;
  }
  let selectClase = document.getElementById("select-clase-agenda").value;
  creditos -= 1;
  localStorage.setItem("moeva_creditos", creditos);
  localStorage.setItem("moeva_clase_agendada", selectClase);

  document.getElementById("lbl-creditos").innerText = creditos;
  document.getElementById("lbl-clase-reservada").innerText = selectClase;
  document.getElementById("mensaje-reserva").innerText = "✔ ¡Reserva confirmada para: " + selectClase + "!";
  alert("¡Clase reservada con éxito! Se ha descontado 1 crédito.");
}

function cancelarClase() {
  let claseActual = localStorage.getItem("moeva_clase_agendada");
  if(!claseActual || claseActual === "Ninguna") {
    alert("No tienes ninguna clase reservada actualmente.");
    return;
  }
  let creditos = parseInt(localStorage.getItem("moeva_creditos") || "0") + 1;
  localStorage.setItem("moeva_creditos", creditos);
  localStorage.setItem("moeva_clase_agendada", "Ninguna");

  document.getElementById("lbl-creditos").innerText = creditos;
  document.getElementById("lbl-clase-reservada").innerText = "Ninguna";
  document.getElementById("mensaje-reserva").innerText = "⚠ Has cancelado tu reserva. Se te ha devuelto 1 crédito.";
  alert("Reserva cancelada correctamente.");
}

function simularPago() {
  let creditos = parseInt(localStorage.getItem("moeva_creditos") || "0") + 8;
  localStorage.setItem("moeva_creditos", creditos);
  document.getElementById("lbl-creditos").innerText = creditos;
  alert("¡Pago procesado con éxito! Se han acreditado 8 nuevas clases a tu cuenta.");
}

function guardarRequisitos(event) {
  event.preventDefault();
  let ficha = document.getElementById("txt-ficha-medica").value;
  let acepto = document.getElementById("check-reglamento").checked;
  if(acepto) {
    localStorage.setItem("moeva_ficha", ficha);
    alert("¡Ficha médica y reglamento guardados correctamente en tu expediente!");
  }
}

function cerrarSesionAlumna() {
  localStorage.removeItem("moeva_nombre");
  localStorage.removeItem("moeva_email");
  localStorage.removeItem("moeva_creditos");
  localStorage.removeItem("moeva_clase_agendada");
  document.getElementById("auth-container").style.display = "block";
  document.getElementById("dashboard-alumna").style.display = "none";
  alert("Sesión cerrada.");
}

function loginAdmin() {
  let pass = document.getElementById("admin-pass").value;
  if(pass === "moeva2026") {
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-content").style.display = "block";
    
    document.getElementById("admin-row-nombre").innerText = localStorage.getItem("moeva_nombre") || "Sin registro";
    document.getElementById("admin-row-creditos").innerText = localStorage.getItem("moeva_creditos") || "-";
    document.getElementById("admin-row-clase").innerText = localStorage.getItem("moeva_clase_agendada" ) || "-";
  } else {
    alert("Contraseña incorrecta (Usa: moeva2026)");
  }
}

function adminModificarCreditos() {
  let current = parseInt(localStorage.getItem("moeva_creditos") || "0");
  let nuevo = current + 1;
  localStorage.setItem("moeva_creditos", nuevo);
  document.getElementById("admin-row-creditos").innerText = nuevo;
  alert("Crédito añadido desde el panel de administración.");
}

function logoutAdmin() {
  document.getElementById("admin-login").style.display = "block";
  document.getElementById("admin-content").style.display = "none";
  document.getElementById("admin-pass").value = "";
}

window.onload = function() {
  let nombre = localStorage.getItem("moeva_nombre");
  if(nombre) {
    cargarDashboardAlumna(nombre, localStorage.getItem("moeva_creditos"), localStorage.getItem("moeva_clase_agendada"));
  }
}
