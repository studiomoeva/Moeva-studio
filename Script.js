// Contraseña de administración exacta solicitada
const PASSWORD_ADMIN = "moeva2026";

// Datos de clases por día de la semana con cupos reales inicializados correctamente
const horariosPorDia = {
  lunes: [
    { hora: "7:00 AM", nombre: "Acondicionamiento", cupos: "8 / 8 lugares" },
    { hora: "8:00 AM", nombre: "Pole Fitness", cupos: "8 / 8 lugares" },
    { hora: "9:00 AM", nombre: "Floorwork", cupos: "8 / 8 lugares" },
    { hora: "5:00 PM", nombre: "Exotic", cupos: "8 / 8 lugares" },
    { hora: "6:00 PM", nombre: "Acondicionamiento", cupos: "8 / 8 lugares" },
    { hora: "7:00 PM", nombre: "Stretching", cupos: "8 / 8 lugares" },
    { hora: "8:00 PM", nombre: "Pole Fitness", cupos: "8 / 8 lugares" }
  ],
  martes: [
    { hora: "7:00 AM", nombre: "Exotic", cupos: "8 / 8 lugares" },
    { hora: "8:00 AM", nombre: "Exotic", cupos: "8 / 8 lugares" },
    { hora: "9:00 AM", nombre: "Stretching", cupos: "8 / 8 lugares" },
    { hora: "5:00 PM", nombre: "Acondicionamiento", cupos: "8 / 8 lugares" },
    { hora: "6:00 PM", nombre: "Pole Fitness", cupos: "8 / 8 lugares" },
    { hora: "7:00 PM", nombre: "Exotic Principiantes", cupos: "8 / 8 lugares" },
    { hora: "8:00 PM", nombre: "Stretching", cupos: "8 / 8 lugares" }
  ],
  miercoles: [
    { hora: "7:00 AM", nombre: "Floorwork", cupos: "8 / 8 lugares" },
    { hora: "8:00 AM", nombre: "Exotic Principiantes", cupos: "8 / 8 lugares" },
    { hora: "9:00 AM", nombre: "Pole Fitness", cupos: "8 / 8 lugares" },
    { hora: "5:00 PM", nombre: "Pole Fitness", cupos: "8 / 8 lugares" },
    { hora: "6:00 PM", nombre: "Urbano", cupos: "8 / 8 lugares" },
    { hora: "7:00 PM", nombre: "Exotic", cupos: "8 / 8 lugares" },
    { hora: "8:00 PM", nombre: "Floorwork", cupos: "8 / 8 lugares" }
  ],
  jueves: [
    { hora: "7:00 AM", nombre: "Pole Fitness", cupos: "8 / 8 lugares" },
    { hora: "8:00 AM", nombre: "Stretching", cupos: "8 / 8 lugares" },
    { hora: "9:00 AM", nombre: "Urbano", cupos: "8 / 8 lugares" },
    { hora: "5:00 PM", nombre: "Pole Fitness", cupos: "8 / 8 lugares" },
    { hora: "6:00 PM", nombre: "Pole Fitness", cupos: "8 / 8 lugares" },
    { hora: "7:00 PM", nombre: "Acondicionamiento", cupos: "8 / 8 lugares" },
    { hora: "8:00 PM", nombre: "Exotic", cupos: "8 / 8 lugares" }
  ],
  viernes: [
    { hora: "7:00 AM", nombre: "Pole Fitness", cupos: "8 / 8 lugares" },
    { hora: "8:00 AM", nombre: "Exotic", cupos: "8 / 8 lugares" },
    { hora: "9:00 AM", nombre: "Floorwork", cupos: "8 / 8 lugares" },
    { hora: "5:00 PM", nombre: "Pole Fitness", cupos: "8 / 8 lugares" },
    { hora: "6:00 PM", nombre: "Floorwork", cupos: "8 / 8 lugares" },
    { hora: "7:00 PM", nombre: "Exotic", cupos: "8 / 8 lugares" }
  ],
  sabado: [
    { hora: "8:00 AM", nombre: "Exotic", cupos: "8 / 8 lugares" },
    { hora: "9:00 AM", nombre: "Stretching", cupos: "8 / 8 lugares" }
  ],
  domingo: [
    { hora: "9:00 AM", nombre: "Ritmos Latinos (Salsa)", cupos: "8 / 8 lugares" },
    { hora: "10:00 AM", nombre: "Ritmos Latinos (Bachata/Cumbia)", cupos: "8 / 8 lugares" }
  ]
};

function filtrarDia(dia) {
  // Cambiar estilos de pestañas activas
  const botones = document.querySelectorAll('.tab-btn');
  botones.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  const contenedor = document.getElementById('contenedor-clases');
  contenedor.innerHTML = "";

  const clasesDelDia = horariosPorDia[dia] || [];
  
  if (clasesDelDia.length === 0) {
    contenedor.innerHTML = "<p>No hay clases programadas para este día.</p>";
    return;
  }

  clasesDelDia.forEach(clase => {
    const card = document.createElement('div');
    card.className = 'clase-slot-card';
    card.innerHTML = `
      <div>
        <div class="slot-hora">${clase.hora}</div>
        <div class="slot-nombre">${clase.nombre}</div>
        <div class="slot-cupos">${clase.cupos}</div>
      </div>
      <button class="btn-reservar-slot" onclick="reservarClaseSlot('${clase.nombre}', '${clase.hora}')">Reservar Lugar</button>
    `;
    contenedor.appendChild(card);
  });
}

function reservarClaseSlot(nombreClase, horaClase) {
  let nombreUsuario = prompt("Ingresa tu nombre para confirmar la reserva:");
  if (nombreUsuario) {
    alert(`¡Listo ${nombreUsuario}! Has reservado exitosamente tu clase de ${nombreClase} a las ${horaClase}.`);
  }
}

// Función de Acceso Admin protegida con contraseña
function accesoAdmin() {
  let pass = prompt("Ingresa la contraseña de administración:");
  if (pass === PASSWORD_ADMIN) {
    alert("¡Acceso concedido! Entrando al panel de administración de MÓEVA...");
    // Aquí puedes abrir las funciones de gestión de alumnas y paquetes
  } else if (pass !== null) {
    alert("Contraseña incorrecta. Acceso denegado.");
  }
}

function enviarMensaje(event) {
  event.preventDefault();
  alert("¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.");
  event.target.reset();
}

// Cargar lunes por defecto al abrir la página
window.onload = function() {
  const contenedor = document.getElementById('contenedor-clases');
  if (contenedor) {
    // Simula clic en el primer día
    filtrarDia('lunes');
  }
};
