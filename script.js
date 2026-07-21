// Base de datos local simulada en memoria del navegador
let currentUser = null;
let userCredits = 4;
let userReservations = [];

// Alternar pestañas de Autenticación
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');

    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabs[0].classList.add('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabs[1].classList.add('active');
    }
}

// Simular Inicio de Sesión
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    
    currentUser = email.split('@')[0];
    document.getElementById('user-display-name').textContent = currentUser;
    
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');
    updateDashboard();
}

// Simular Registro / Afiliación
function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    
    currentUser = name;
    document.getElementById('user-display-name').textContent = currentUser;
    
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');
    updateDashboard();
}

// Cerrar Sesión
function handleLogout() {
    currentUser = null;
    document.getElementById('student-dashboard').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
}

// Actualizar Vista del Dashboard
function updateDashboard() {
    document.getElementById('credit-count').textContent = userCredits;
    const list = document.getElementById('reservations-list');
    list.innerHTML = '';

    if (userReservations.length === 0) {
        list.innerHTML = '<li>No tienes reservas activas en este momento.</li>';
    } else {
        userReservations.forEach((res, index) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.innerHTML = `<span><strong>${res.discipline}</strong> - ${res.time}</span> <button onclick="cancelBooking(${index})" class="btn-secondary sm">Cancelar</button>`;
            list.appendChild(li);
        });
    }
}

// Agendar Clase
function handleBooking(event) {
    event.preventDefault();
    if (userCredits <= 0) {
        alert('No tienes suficientes créditos disponibles. Adquiere un nuevo paquete.');
        return;
    }

    const discipline = document.getElementById('book-discipline').value;
    const time = document.getElementById('book-time').value;

    userCredits--;
    userReservations.push({ discipline, time });
    updateDashboard();
    alert('¡Clase reservada con éxito!');
}

// Cancelar Reserva (Devuelve el crédito)
function cancelBooking(index) {
    userReservations.splice(index, 1);
    userCredits++;
    updateDashboard();
    alert('Clase cancelada. Tu crédito ha sido restituido.');
}

// Modales de Checkout y Requisitos
function openCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('hidden');
}
function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.add('hidden');
}
function simulatePayment(amount) {
    userCredits += (amount >= 1600 ? 8 : 4);
    closeCheckoutModal();
    updateDashboard();
    alert(`¡Pago de $${amount} MXN procesado con éxito! Se han acreditado tus clases.`);
}

function openMedicalForm() {
    document.getElementById('medical-modal').classList.remove('hidden');
}
function closeMedicalForm() {
    document.getElementById('medical-modal').classList.add('hidden');
}
function saveMedicalForm(event) {
    event.preventDefault();
    closeMedicalForm();
    alert('¡Ficha médica guardada correctamente en tu expediente!');
}

function openReglamentoModal() {
    document.getElementById('reglamento-modal').classList.remove('hidden');
}
function closeReglamentoModal() {
    document.getElementById('reglamento-modal').classList.add('hidden');
}
function acceptReglamento() {
    closeReglamentoModal();
    alert('Has aceptado el reglamento interno y la cuota de afiliación.');
}

// Panel de Administración Oculto
function toggleAdminPanel() {
    const panel = document.getElementById('admin-panel');
    panel.classList.toggle('hidden');
}
