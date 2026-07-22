/* ==========================================================================
   MOÉVA — Lógica del sitio
   Todo se guarda en localStorage del navegador (no hay servidor/base de
   datos real). Esto es suficiente para una tienda pequeña que administra
   su propio equipo desde el mismo navegador/estudio, pero OJO:
   - Las contraseñas se guardan en texto simple, no está cifrado.
   - Si el cliente borra datos del navegador o cambia de equipo, se pierde
     la información. Para algo más robusto a futuro se necesitaría un
     backend real (Firebase, un servidor propio, etc.).
   ========================================================================== */

const STORAGE_KEYS = {
    users: 'moeva_users',
    reservations: 'moeva_reservations',
    schedule: 'moeva_schedule',
    packages: 'moeva_packages',
    disciplines: 'moeva_disciplines',
    session: 'moeva_session',
    adminSession: 'moeva_admin_session'
};

/* -------------------------- Datos por defecto -------------------------- */

const DEFAULT_DISCIPLINES = [
    'Pole Fitness', 'Exotic Pole', 'Exotic Principiantes', 'Acondicionamiento',
    'Urbano', 'Floorwork', 'Stretching', 'Ritmos Latinos'
];

const DEFAULT_SCHEDULE = [
    { day: 'Lunes', time: '7:00 AM', discipline: 'Acondicionamiento' },
    { day: 'Martes', time: '7:00 AM', discipline: 'Exotic Pole' },
    { day: 'Miércoles', time: '7:00 AM', discipline: 'Floorwork' },
    { day: 'Jueves', time: '7:00 AM', discipline: 'Pole Fitness' },
    { day: 'Viernes', time: '7:00 AM', discipline: 'Pole Fitness' },
    { day: 'Lunes', time: '8:00 AM', discipline: 'Pole Fitness' },
    { day: 'Martes', time: '8:00 AM', discipline: 'Exotic Pole' },
    { day: 'Miércoles', time: '8:00 AM', discipline: 'Exotic Principiantes' },
    { day: 'Jueves', time: '8:00 AM', discipline: 'Stretching' },
    { day: 'Viernes', time: '8:00 AM', discipline: 'Exotic Pole' },
    { day: 'Sábado', time: '8:00 AM', discipline: 'Exotic Pole' },
    { day: 'Lunes', time: '9:00 AM', discipline: 'Floorwork' },
    { day: 'Martes', time: '9:00 AM', discipline: 'Stretching' },
    { day: 'Miércoles', time: '9:00 AM', discipline: 'Pole Fitness' },
    { day: 'Jueves', time: '9:00 AM', discipline: 'Urbano' },
    { day: 'Viernes', time: '9:00 AM', discipline: 'Floorwork' },
    { day: 'Sábado', time: '9:00 AM', discipline: 'Stretching' },
    { day: 'Lunes', time: '5:00 PM', discipline: 'Exotic Pole' },
    { day: 'Martes', time: '5:00 PM', discipline: 'Acondicionamiento' },
    { day: 'Miércoles', time: '5:00 PM', discipline: 'Pole Fitness' },
    { day: 'Jueves', time: '5:00 PM', discipline: 'Pole Fitness' },
    { day: 'Viernes', time: '5:00 PM', discipline: 'Pole Fitness' },
    { day: 'Lunes', time: '6:00 PM', discipline: 'Acondicionamiento' },
    { day: 'Martes', time: '6:00 PM', discipline: 'Pole Fitness' },
    { day: 'Miércoles', time: '6:00 PM', discipline: 'Urbano' },
    { day: 'Jueves', time: '6:00 PM', discipline: 'Pole Fitness' },
    { day: 'Viernes', time: '6:00 PM', discipline: 'Floorwork' },
    { day: 'Lunes', time: '7:00 PM', discipline: 'Stretching' },
    { day: 'Martes', time: '7:00 PM', discipline: 'Exotic Principiantes' },
    { day: 'Miércoles', time: '7:00 PM', discipline: 'Exotic Pole' },
    { day: 'Jueves', time: '7:00 PM', discipline: 'Acondicionamiento' },
    { day: 'Viernes', time: '7:00 PM', discipline: 'Exotic Pole' },
    { day: 'Lunes', time: '8:00 PM', discipline: 'Pole Fitness' },
    { day: 'Martes', time: '8:00 PM', discipline: 'Stretching' },
    { day: 'Miércoles', time: '8:00 PM', discipline: 'Floorwork' },
    { day: 'Jueves', time: '8:00 PM', discipline: 'Exotic Pole' },
    { day: 'Viernes', time: '8:00 PM', discipline: 'Ritmos Latinos' },
    { day: 'Domingo', time: '9:00 AM', discipline: 'Ritmos Latinos' },
    { day: 'Domingo', time: '10:00 AM', discipline: 'Ritmos Latinos' }
];

const DEFAULT_PACKAGES = [
    { id: 'muestra', nombre: 'Clase muestra', precio: 250, creditos: 1 },
    { id: 'suelta', nombre: 'Clase suelta', precio: 380, creditos: 1 },
    { id: 'privada', nombre: 'Clase privada', precio: 600, creditos: 1 },
    { id: 'p4', nombre: '4 clases', precio: 900, creditos: 4 },
    { id: 'p8', nombre: '8 clases', precio: 1500, creditos: 8 },
    { id: 'p12', nombre: '12 clases', precio: 1900, creditos: 12 },
    { id: 'p16', nombre: '16 clases', precio: 2200, creditos: 16 },
    { id: 'ilimitado', nombre: 'Ilimitado', precio: 2600, creditos: 999 }
];

/* Cuenta de administración por defecto — CAMBIA esta contraseña desde el
   panel o directamente aquí antes de publicar el sitio. */
const DEFAULT_ADMIN = {
    email: 'admin@moeva.studio',
    password: 'moeva2026',
    name: 'Administración MOÉVA',
    role: 'admin'
};

/* ------------------------------ Utilidades ------------------------------ */

function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        console.error('Error leyendo', key, e);
        return fallback;
    }
}

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getUsers() { return loadJSON(STORAGE_KEYS.users, {}); }
function saveUsers(u) { saveJSON(STORAGE_KEYS.users, u); }
function getReservations() { return loadJSON(STORAGE_KEYS.reservations, []); }
function saveReservations(r) { saveJSON(STORAGE_KEYS.reservations, r); }
function getSchedule() { return loadJSON(STORAGE_KEYS.schedule, DEFAULT_SCHEDULE); }
function saveSchedule(s) { saveJSON(STORAGE_KEYS.schedule, s); }
function getPackages() { return loadJSON(STORAGE_KEYS.packages, DEFAULT_PACKAGES); }
function savePackages(p) { saveJSON(STORAGE_KEYS.packages, p); }
function getDisciplines() { return loadJSON(STORAGE_KEYS.disciplines, DEFAULT_DISCIPLINES); }
function saveDisciplines(d) { saveJSON(STORAGE_KEYS.disciplines, d); }

function getSession() { return localStorage.getItem(STORAGE_KEYS.session); }
function setSession(email) { localStorage.setItem(STORAGE_KEYS.session, email || ''); }
function getAdminSession() { return localStorage.getItem(STORAGE_KEYS.adminSession) === 'true'; }
function setAdminSession(val) { localStorage.setItem(STORAGE_KEYS.adminSession, val ? 'true' : 'false'); }

function money(n) {
    return '$' + Number(n).toLocaleString('es-MX') + ' MXN';
}

/* --------------------------- Inicialización --------------------------- */

function seedDataIfNeeded() {
    const users = getUsers();
    if (!users[DEFAULT_ADMIN.email]) {
        users[DEFAULT_ADMIN.email] = { ...DEFAULT_ADMIN, credits: 0, reservationsCount: 0 };
        saveUsers(users);
    }
    if (!localStorage.getItem(STORAGE_KEYS.schedule)) saveSchedule(DEFAULT_SCHEDULE);
    if (!localStorage.getItem(STORAGE_KEYS.packages)) savePackages(DEFAULT_PACKAGES);
    if (!localStorage.getItem(STORAGE_KEYS.disciplines)) saveDisciplines(DEFAULT_DISCIPLINES);
    if (!localStorage.getItem(STORAGE_KEYS.reservations)) saveReservations([]);
}

document.addEventListener('DOMContentLoaded', () => {
    seedDataIfNeeded();
    renderScheduleTable();
    populateDisciplineSelects();
    populateScheduleSelects();
    populatePackageOptions();

    const session = getSession();
    if (session) {
        const users = getUsers();
        if (users[session]) {
            showDashboard(users[session]);
        }
    }

    if (getAdminSession()) {
        showAdminPanel();
    }
});

/* ------------------------------ Auth Alumnas ------------------------------ */

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('#auth-container .tab-btn');
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

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const users = getUsers();
    const user = users[email];

    if (!user || user.password !== password) {
        alert('Correo o contraseña incorrectos.');
        return;
    }
    if (user.role === 'admin') {
        alert('Esta es una cuenta de administración. Usa el acceso de personal en el pie de página.');
        return;
    }

    setSession(email);
    showDashboard(user);
    event.target.reset();
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const phone = document.getElementById('reg-phone').value.trim();
    const birthday = document.getElementById('reg-birthday').value;

    const users = getUsers();
    if (users[email]) {
        alert('Ya existe una cuenta con ese correo. Intenta iniciar sesión.');
        return;
    }

    users[email] = {
        name, email, password, phone, birthday,
        role: 'student',
        credits: 0,
        membershipPaid: false,
        reglamentoSigned: false,
        medicalSigned: false,
        medicalForm: null,
        createdAt: new Date().toISOString()
    };
    saveUsers(users);
    setSession(email);
    showDashboard(users[email]);
    event.target.reset();
    alert('¡Cuenta creada! Antes de tomar tu primera clase, completa tu ficha médica y firma el reglamento desde tu panel. Recuerda que la afiliación anual tiene un costo de $550 MXN, puedes pagarla en el estudio o por transferencia.');
}

function handleLogout() {
    setSession(null);
    document.getElementById('student-dashboard').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('login-form').reset();
}

/* ------------------------------ Dashboard ------------------------------ */

function currentUserEmail() {
    return getSession();
}

function currentUser() {
    const email = currentUserEmail();
    if (!email) return null;
    return getUsers()[email] || null;
}

function showDashboard(user) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');
    document.getElementById('user-display-name').textContent = user.name;
    renderDashboard();
}

function renderDashboard() {
    const user = currentUser();
    if (!user) return;

    document.getElementById('credit-count').textContent = user.credits >= 999 ? '∞' : user.credits;

    // Estado de trámites
    const medBtn = document.getElementById('medical-status-btn');
    medBtn.textContent = user.medicalSigned ? 'Ver / Actualizar ficha' : 'Completar ficha médica';
    medBtn.classList.toggle('btn-secondary', true);
    document.getElementById('medical-status-badge').textContent = user.medicalSigned ? 'Completa ✓' : 'Pendiente';
    document.getElementById('medical-status-badge').className = 'status-badge ' + (user.medicalSigned ? 'status-ok' : 'status-pending');

    document.getElementById('reglamento-status-badge').textContent = user.reglamentoSigned ? 'Firmado ✓' : 'Pendiente';
    document.getElementById('reglamento-status-badge').className = 'status-badge ' + (user.reglamentoSigned ? 'status-ok' : 'status-pending');

    // Reservas
    const reservations = getReservations().filter(r => r.userEmail === user.email && r.status !== 'cancelada');
    const list = document.getElementById('reservations-list');
    list.innerHTML = '';
    if (reservations.length === 0) {
        list.innerHTML = '<li class="empty-state">No tienes clases agendadas todavía.</li>';
    } else {
        reservations.forEach(res => {
            const li = document.createElement('li');
            li.className = 'reservation-item';
            li.innerHTML = `<span><strong>${res.discipline}</strong> — ${res.day} ${res.time}</span>
                <button onclick="cancelBooking('${res.id}')" class="btn-secondary sm">Cancelar</button>`;
            list.appendChild(li);
        });
    }
}

/* ------------------------------ Reservar clase (alumna) ------------------------------ */

function openBookingModal() {
    const user = currentUser();
    if (!user) return;
    if (!user.reglamentoSigned || !user.medicalSigned) {
        alert('Antes de agendar necesitas completar tu ficha médica y firmar el reglamento interno. Puedes hacerlo desde tu panel.');
        return;
    }
    if (user.credits <= 0) {
        alert('No tienes créditos disponibles. Compra un paquete para poder agendar.');
        openCheckoutModal();
        return;
    }
    document.getElementById('booking-modal').classList.remove('hidden');
}
function closeBookingModal() { document.getElementById('booking-modal').classList.add('hidden'); }

function handleBooking(event) {
    event.preventDefault();
    const user = currentUser();
    if (!user || user.credits <= 0) {
        alert('No tienes créditos disponibles.');
        return;
    }

    const scheduleId = document.getElementById('book-slot').value;
    if (!scheduleId) { alert('Elige un horario.'); return; }
    const [day, time, discipline] = scheduleId.split('|');

    const reservations = getReservations();
    reservations.push({
        id: uid(),
        userEmail: user.email,
        guestName: null,
        discipline, day, time,
        status: 'confirmada',
        paymentMethod: 'créditos',
        createdAt: new Date().toISOString()
    });
    saveReservations(reservations);

    const users = getUsers();
    users[user.email].credits -= 1;
    saveUsers(users);

    closeBookingModal();
    renderDashboard();
    alert('¡Clase reservada con éxito!');
}

function cancelBooking(id) {
    const user = currentUser();
    if (!user) return;
    const reservations = getReservations();
    const res = reservations.find(r => r.id === id);
    if (!res) return;

    res.status = 'cancelada';
    saveReservations(reservations);

    if (res.userEmail) {
        const users = getUsers();
        if (users[res.userEmail] && users[res.userEmail].credits < 999) {
            users[res.userEmail].credits += 1;
            saveUsers(users);
        }
    }
    renderDashboard();
    alert('Clase cancelada. Tu crédito ha sido restituido.');
}

/* ------------------------------ Ficha médica ------------------------------ */

function toggleMinorFields() {
    const checked = document.getElementById('med-is-minor').checked;
    document.getElementById('minor-fields').classList.toggle('hidden', !checked);
}

function openMedicalForm() {
    const user = currentUser();
    if (!user) return;
    const form = document.getElementById('medical-form');
    form.reset();
    document.getElementById('minor-fields').classList.add('hidden');

    if (user.medicalForm) {
        const m = user.medicalForm;
        form.elements['med-name'].value = m.nombre || user.name;
        form.elements['med-birthday'].value = m.fechaNacimiento || '';
        form.elements['med-age'].value = m.edad || '';
        form.elements['med-phone'].value = m.telefono || '';
        form.elements['med-email'].value = m.correo || user.email;
        form.elements['med-address'].value = m.domicilio || '';
        form.elements['med-emergency-name'].value = m.contactoEmergenciaNombre || '';
        form.elements['med-emergency-relation'].value = m.contactoEmergenciaParentesco || '';
        form.elements['med-emergency-phone'].value = m.contactoEmergenciaTelefono || '';
        form.elements['med-emergency-phone-alt'].value = m.contactoEmergenciaTelefonoAlt || '';
        form.elements['med-current-injury'].value = m.lesionActual || '';
        form.elements['med-past-injuries'].value = m.lesionesAnteriores || '';
        form.elements['med-surgeries'].value = m.cirugias || '';
        (m.condiciones || []).forEach(v => {
            const box = [...form.elements['med-cond']].find(c => c.value === v);
            if (box) box.checked = true;
        });
        form.elements['med-cond-details'].value = m.condicionesDetalle || '';
        form.elements['med-medication'].value = m.medicamentos || '';
        form.elements['med-restriction'].value = m.restriccionMedica || '';
        form.elements['med-authorization'].value = m.autorizacionMedica || 'Sí';
        form.elements['med-blood-type'].value = m.tipoSangre || '';
        form.elements['med-allergies'].value = m.alergias || '';
        form.elements['med-additional'].value = m.infoAdicional || '';
        form.elements['med-accept-declarations'].checked = !!m.aceptaDeclaraciones;
        form.elements['med-emergency-authorization'].value = m.autorizacionEmergencia || form.elements['med-emergency-authorization'].value;
        form.elements['med-image-use'].value = m.usoImagen || form.elements['med-image-use'].value;
        if (m.esMenor) {
            document.getElementById('med-is-minor').checked = true;
            document.getElementById('minor-fields').classList.remove('hidden');
            form.elements['med-guardian-name'].value = m.tutorNombre || '';
            form.elements['med-guardian-relation'].value = m.tutorParentesco || '';
            form.elements['med-guardian-phone'].value = m.tutorTelefono || '';
            form.elements['med-guardian-accept'].checked = !!m.tutorAcepta;
        }
        form.elements['med-signature'].value = m.firma || '';
    } else {
        form.elements['med-name'].value = user.name;
        form.elements['med-email'].value = user.email;
    }
    document.getElementById('medical-modal').classList.remove('hidden');
}
function closeMedicalForm() { document.getElementById('medical-modal').classList.add('hidden'); }

function saveMedicalForm(event) {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;
    const form = event.target;
    const isMinor = form.elements['med-is-minor'].checked;

    const condiciones = [...form.elements['med-cond']]
        .filter(c => c.checked)
        .map(c => c.value);

    const users = getUsers();
    users[user.email].medicalForm = {
        nombre: form.elements['med-name'].value,
        fechaNacimiento: form.elements['med-birthday'].value,
        edad: form.elements['med-age'].value,
        telefono: form.elements['med-phone'].value,
        correo: form.elements['med-email'].value,
        domicilio: form.elements['med-address'].value,
        contactoEmergenciaNombre: form.elements['med-emergency-name'].value,
        contactoEmergenciaParentesco: form.elements['med-emergency-relation'].value,
        contactoEmergenciaTelefono: form.elements['med-emergency-phone'].value,
        contactoEmergenciaTelefonoAlt: form.elements['med-emergency-phone-alt'].value,
        lesionActual: form.elements['med-current-injury'].value,
        lesionesAnteriores: form.elements['med-past-injuries'].value,
        cirugias: form.elements['med-surgeries'].value,
        condiciones: condiciones,
        condicionesDetalle: form.elements['med-cond-details'].value,
        medicamentos: form.elements['med-medication'].value,
        restriccionMedica: form.elements['med-restriction'].value,
        autorizacionMedica: form.elements['med-authorization'].value,
        tipoSangre: form.elements['med-blood-type'].value,
        alergias: form.elements['med-allergies'].value,
        infoAdicional: form.elements['med-additional'].value,
        aceptaDeclaraciones: form.elements['med-accept-declarations'].checked,
        autorizacionEmergencia: form.elements['med-emergency-authorization'].value,
        usoImagen: form.elements['med-image-use'].value,
        esMenor: isMinor,
        tutorNombre: isMinor ? form.elements['med-guardian-name'].value : '',
        tutorParentesco: isMinor ? form.elements['med-guardian-relation'].value : '',
        tutorTelefono: isMinor ? form.elements['med-guardian-phone'].value : '',
        tutorAcepta: isMinor ? form.elements['med-guardian-accept'].checked : false,
        firma: form.elements['med-signature'].value,
        firmadoEl: new Date().toISOString()
    };
    users[user.email].medicalSigned = true;
    saveUsers(users);

    closeMedicalForm();
    renderDashboard();
    alert('¡Ficha médica guardada correctamente en tu expediente!');
}

/* ------------------------------ Reglamento ------------------------------ */

function openReglamentoModal() {
    document.getElementById('reglamento-modal').classList.remove('hidden');
}
function closeReglamentoModal() { document.getElementById('reglamento-modal').classList.add('hidden'); }

function acceptReglamento() {
    const user = currentUser();
    if (!user) { closeReglamentoModal(); return; }
    const users = getUsers();
    users[user.email].reglamentoSigned = true;
    saveUsers(users);
    closeReglamentoModal();
    renderDashboard();
    alert('Has aceptado el reglamento interno.');
}

/* ------------------------------ Compra de paquetes ------------------------------ */

function populatePackageOptions() {
    const packages = getPackages();
    const select = document.getElementById('checkout-package');
    if (!select) return;
    select.innerHTML = packages.map(p =>
        `<option value="${p.id}">${p.nombre} — ${money(p.precio)}</option>`
    ).join('');
}

function openCheckoutModal() {
    populatePackageOptions();
    document.getElementById('checkout-modal').classList.remove('hidden');
}
function closeCheckoutModal() { document.getElementById('checkout-modal').classList.add('hidden'); }

function handleCheckout(event) {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;

    const packageId = document.getElementById('checkout-package').value;
    const paymentMethod = document.getElementById('checkout-payment').value;
    const pkg = getPackages().find(p => p.id === packageId);
    if (!pkg) return;

    if (paymentMethod === 'efectivo' || paymentMethod === 'tarjeta') {
        // Se paga físicamente en el estudio. Queda pendiente de confirmación
        // por parte del staff en el panel de administración.
        registerPendingPurchase(user.email, pkg, paymentMethod);
        closeCheckoutModal();
        alert(`Elegiste pagar ${pkg.nombre} (${money(pkg.precio)}) en el estudio con ${paymentMethod}. Tus créditos se activarán cuando el staff confirme tu pago en recepción.`);
    } else {
        registerPendingPurchase(user.email, pkg, 'transferencia');
        closeCheckoutModal();
        alert(`Elegiste pagar por transferencia. Escríbenos por WhatsApp (222 469 4805) para enviarte los datos bancarios y comparte tu comprobante. Tus créditos se activarán cuando confirmemos el pago.`);
    }
}

function registerPendingPurchase(userEmail, pkg, paymentMethod) {
    const reservations = getReservations(); // reutilizamos el mismo storage de "movimientos" via una lista separada
    const purchases = loadJSON('moeva_purchases', []);
    purchases.push({
        id: uid(),
        userEmail,
        packageId: pkg.id,
        packageName: pkg.nombre,
        precio: pkg.precio,
        creditos: pkg.creditos,
        paymentMethod,
        status: 'pendiente',
        createdAt: new Date().toISOString()
    });
    saveJSON('moeva_purchases', purchases);
}

/* ------------------------------ Reserva sin cuenta (invitada) ------------------------------ */

function openGuestModal() {
    populateGuestPackageOptions();
    document.getElementById('guest-modal').classList.remove('hidden');
}
function closeGuestModal() { document.getElementById('guest-modal').classList.add('hidden'); }

function populateGuestPackageOptions() {
    const select = document.getElementById('guest-package');
    if (!select) return;
    const packages = getPackages().filter(p => p.id === 'muestra' || p.id === 'suelta');
    select.innerHTML = packages.map(p =>
        `<option value="${p.id}">${p.nombre} — ${money(p.precio)}</option>`
    ).join('');
}

function handleGuestBooking(event) {
    event.preventDefault();
    const name = document.getElementById('guest-name').value.trim();
    const phone = document.getElementById('guest-phone').value.trim();
    const email = document.getElementById('guest-email').value.trim();
    const packageId = document.getElementById('guest-package').value;
    const scheduleId = document.getElementById('guest-slot').value;
    const paymentMethod = document.getElementById('guest-payment').value;

    if (!scheduleId) { alert('Elige un horario.'); return; }
    const [day, time, discipline] = scheduleId.split('|');
    const pkg = getPackages().find(p => p.id === packageId);

    const reservations = getReservations();
    reservations.push({
        id: uid(),
        userEmail: null,
        guestName: name,
        guestPhone: phone,
        guestEmail: email,
        discipline, day, time,
        packageName: pkg.nombre,
        precio: pkg.precio,
        status: paymentMethod === 'transferencia' ? 'pendiente de pago' : 'confirmada (paga en estudio)',
        paymentMethod,
        createdAt: new Date().toISOString()
    });
    saveReservations(reservations);

    closeGuestModal();
    event.target.reset();

    if (paymentMethod === 'transferencia') {
        alert('¡Reserva registrada! Escríbenos por WhatsApp (222 469 4805) para los datos de transferencia y envíanos tu comprobante para confirmar tu lugar.');
    } else {
        alert(`¡Reserva registrada! Paga tu ${pkg.nombre} (${money(pkg.precio)}) con ${paymentMethod} directamente al llegar al estudio.`);
    }
}

/* ------------------------------ Horario público (dinámico) ------------------------------ */

const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function renderScheduleTable() {
    const schedule = getSchedule();
    const mainSchedule = schedule.filter(s => s.discipline !== 'Ritmos Latinos');
    const times = [...new Set(mainSchedule.map(s => s.time))].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const tbody = document.getElementById('schedule-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    times.forEach(time => {
        const tr = document.createElement('tr');
        let row = `<td>${time}</td>`;
        days.forEach(day => {
            const entry = mainSchedule.find(s => s.day === day && s.time === time);
            row += `<td>${entry ? entry.discipline : '-'}</td>`;
        });
        tr.innerHTML = row;
        tbody.appendChild(tr);
    });

    // Ritmos latinos
    const ritmos = schedule.filter(s => s.discipline === 'Ritmos Latinos');
    const ritmosBox = document.getElementById('ritmos-schedule');
    if (ritmosBox) {
        ritmosBox.innerHTML = ritmos.map(r => `
            <div class="card">
                <h3>${r.day}</h3>
                <p><strong>${r.time}</strong></p>
            </div>
        `).join('');
    }
}

function timeToMinutes(t) {
    const [time, period] = t.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
}

function populateScheduleSelects() {
    const schedule = getSchedule();
    const options = schedule.map(s =>
        `<option value="${s.day}|${s.time}|${s.discipline}">${s.day} ${s.time} — ${s.discipline}</option>`
    ).join('');

    const bookSlot = document.getElementById('book-slot');
    if (bookSlot) bookSlot.innerHTML = '<option value="">Selecciona un horario</option>' + options;

    const guestSlot = document.getElementById('guest-slot');
    if (guestSlot) guestSlot.innerHTML = '<option value="">Selecciona un horario</option>' + options;
}

function populateDisciplineSelects() {
    const disciplines = getDisciplines();
    const select = document.getElementById('admin-schedule-discipline');
    if (select) {
        select.innerHTML = disciplines.map(d => `<option value="${d}">${d}</option>`).join('');
    }
}

/* ==========================================================================
   PANEL DE ADMINISTRACIÓN (staff)
   ========================================================================== */

function openAdminLogin() {
    document.getElementById('admin-login-modal').classList.remove('hidden');
}
function closeAdminLogin() { document.getElementById('admin-login-modal').classList.add('hidden'); }

function handleAdminLogin(event) {
    event.preventDefault();
    const email = document.getElementById('admin-email').value.trim().toLowerCase();
    const password = document.getElementById('admin-password').value;

    const users = getUsers();
    const user = users[email];
    if (!user || user.role !== 'admin' || user.password !== password) {
        alert('Credenciales de administración incorrectas.');
        return;
    }
    setAdminSession(true);
    closeAdminLogin();
    showAdminPanel();
    event.target.reset();
}

function handleAdminLogout() {
    setAdminSession(false);
    document.getElementById('admin-panel').classList.add('hidden');
}

function showAdminPanel() {
    document.getElementById('admin-panel').classList.remove('hidden');
    document.getElementById('admin-panel').scrollIntoView({ behavior: 'smooth' });
    renderAdminReservations();
    renderAdminStudents();
    renderAdminSchedule();
    renderAdminPackages();
    renderAdminPurchases();
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.admin-tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('admin-tab-' + tab).classList.remove('hidden');
    document.getElementById('admin-tabbtn-' + tab).classList.add('active');
}

/* --- Reservas (admin) --- */

function renderAdminReservations() {
    const container = document.getElementById('admin-reservations-list');
    if (!container) return;
    const reservations = getReservations().slice().reverse();

    if (reservations.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay reservas registradas.</p>';
        return;
    }

    container.innerHTML = reservations.map(r => {
        const who = r.userEmail ? (getUsers()[r.userEmail]?.name || r.userEmail) : `${r.guestName} (invitada — ${r.guestPhone || 's/tel'})`;
        return `
        <div class="admin-row">
            <div>
                <strong>${who}</strong><br>
                <span>${r.discipline} — ${r.day} ${r.time}</span><br>
                <span class="status-badge ${r.status === 'cancelada' ? 'status-pending' : 'status-ok'}">${r.status}</span>
                <span class="muted"> · pago: ${r.paymentMethod}</span>
            </div>
            <div class="admin-row-actions">
                ${r.status !== 'cancelada' ? `<button class="btn-secondary sm" onclick="adminCancelReservation('${r.id}')">Cancelar</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

function adminCancelReservation(id) {
    const reservations = getReservations();
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    res.status = 'cancelada';
    saveReservations(reservations);
    if (res.userEmail) {
        const users = getUsers();
        if (users[res.userEmail] && users[res.userEmail].credits < 999) {
            users[res.userEmail].credits += 1;
            saveUsers(users);
        }
    }
    renderAdminReservations();
    renderAdminStudents();
}

/* --- Compras pendientes de confirmación (admin) --- */

function renderAdminPurchases() {
    const container = document.getElementById('admin-purchases-list');
    if (!container) return;
    const purchases = loadJSON('moeva_purchases', []).slice().reverse();
    const pending = purchases.filter(p => p.status === 'pendiente');

    if (pending.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay pagos pendientes de confirmar.</p>';
        return;
    }

    container.innerHTML = pending.map(p => {
        const user = getUsers()[p.userEmail];
        return `
        <div class="admin-row">
            <div>
                <strong>${user ? user.name : p.userEmail}</strong><br>
                <span>${p.packageName} — ${money(p.precio)} (${p.creditos >= 999 ? '∞' : p.creditos} créditos)</span><br>
                <span class="muted">pago: ${p.paymentMethod}</span>
            </div>
            <div class="admin-row-actions">
                <button class="btn-primary sm" onclick="confirmPurchase('${p.id}')">Confirmar pago</button>
            </div>
        </div>`;
    }).join('');
}

function confirmPurchase(id) {
    const purchases = loadJSON('moeva_purchases', []);
    const purchase = purchases.find(p => p.id === id);
    if (!purchase) return;
    purchase.status = 'confirmado';
    saveJSON('moeva_purchases', purchases);

    const users = getUsers();
    const user = users[purchase.userEmail];
    if (user) {
        user.credits = user.credits >= 999 ? user.credits : user.credits + purchase.creditos;
        if (purchase.creditos >= 999) user.credits = 999;
        saveUsers(users);
    }
    renderAdminPurchases();
    renderAdminStudents();
    if (currentUser()) renderDashboard();
    alert('Pago confirmado y créditos aplicados a la cuenta de la alumna.');
}

/* --- Alumnas (admin) --- */

function renderAdminStudents() {
    const container = document.getElementById('admin-students-list');
    if (!container) return;
    const users = getUsers();
    const students = Object.values(users).filter(u => u.role !== 'admin');

    if (students.length === 0) {
        container.innerHTML = '<p class="empty-state">Aún no hay alumnas registradas.</p>';
        return;
    }

    container.innerHTML = students.map(s => `
        <div class="admin-row admin-row-student">
            <div>
                <strong>${s.name}</strong><br>
                <span class="muted">${s.email} · ${s.phone || 'sin teléfono'} · ${s.birthday ? 'cumpleaños: ' + s.birthday : 'sin fecha de nacimiento'}</span><br>
                <span class="status-badge ${s.medicalSigned ? 'status-ok' : 'status-pending'}">Ficha médica: ${s.medicalSigned ? 'Completa' : 'Pendiente'}</span>
                <span class="status-badge ${s.reglamentoSigned ? 'status-ok' : 'status-pending'}">Reglamento: ${s.reglamentoSigned ? 'Firmado' : 'Pendiente'}</span>
                <span class="muted">· Créditos: ${s.credits >= 999 ? '∞' : s.credits}</span>
            </div>
            <div class="admin-row-actions">
                <button class="btn-secondary sm" onclick="viewMedicalFile('${s.email}')">Ver ficha médica</button>
                <button class="btn-secondary sm" onclick="adjustCredits('${s.email}')">Ajustar créditos</button>
                <button class="btn-secondary sm btn-danger" onclick="deleteStudent('${s.email}')">Borrar alumna</button>
            </div>
        </div>
    `).join('');
}

function deleteStudent(email) {
    const users = getUsers();
    const user = users[email];
    if (!user) return;

    const confirmado = confirm(`¿Seguro que quieres borrar a "${user.name}" (${email})?\n\nEsto elimina su cuenta, ficha médica, créditos y reservas. Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    // Borra la alumna
    delete users[email];
    saveUsers(users);

    // Borra sus reservas
    const reservations = getReservations().filter(r => r.userEmail !== email);
    saveReservations(reservations);

    // Borra sus compras/pagos pendientes o confirmados
    const purchases = loadJSON('moeva_purchases', []).filter(p => p.userEmail !== email);
    saveJSON('moeva_purchases', purchases);

    renderAdminStudents();
    renderAdminPurchases();
    renderAdminReservations();
    alert('Alumna eliminada correctamente.');
}

function viewMedicalFile(email) {
    const user = getUsers()[email];
    if (!user) return;
    if (!user.medicalForm) {
        alert('Esta alumna todavía no ha llenado su ficha médica.');
        return;
    }
    const f = user.medicalForm;
    const condiciones = (f.condiciones && f.condiciones.length) ? f.condiciones.join(', ') : 'Ninguna reportada';
    alert(
        `CARTA RESPONSIVA Y REGISTRO DE SALUD — ${user.name}\n\n` +
        `--- Datos personales ---\n` +
        `Fecha de nacimiento: ${f.fechaNacimiento || '-'}   Edad: ${f.edad || '-'}\n` +
        `Teléfono: ${f.telefono || '-'}\n` +
        `Correo: ${f.correo || '-'}\n` +
        `Domicilio: ${f.domicilio || '-'}\n\n` +
        `--- Contacto de emergencia ---\n` +
        `${f.contactoEmergenciaNombre || '-'} (${f.contactoEmergenciaParentesco || '-'})\n` +
        `Tel: ${f.contactoEmergenciaTelefono || '-'}  Alt: ${f.contactoEmergenciaTelefonoAlt || '-'}\n\n` +
        `--- Antecedentes de salud ---\n` +
        `Lesión actual: ${f.lesionActual || 'No reporta'}\n` +
        `Lesiones anteriores: ${f.lesionesAnteriores || 'No reporta'}\n` +
        `Cirugías: ${f.cirugias || 'No reporta'}\n` +
        `Condiciones marcadas: ${condiciones}\n` +
        `Detalles: ${f.condicionesDetalle || '-'}\n` +
        `Medicamentos: ${f.medicamentos || 'No reporta'}\n` +
        `Restricción médica: ${f.restriccionMedica || 'No reporta'}\n` +
        `Autorización médica para ejercicio: ${f.autorizacionMedica || '-'}\n` +
        `Tipo de sangre: ${f.tipoSangre || '-'}\n` +
        `Alergias: ${f.alergias || 'Ninguna reportada'}\n` +
        `Info adicional: ${f.infoAdicional || '-'}\n\n` +
        `--- Autorizaciones ---\n` +
        `Emergencia: ${f.autorizacionEmergencia || '-'}\n` +
        `Uso de imagen: ${f.usoImagen || '-'}\n` +
        (f.esMenor ? `\n--- Es menor de edad ---\nTutor: ${f.tutorNombre || '-'} (${f.tutorParentesco || '-'})  Tel: ${f.tutorTelefono || '-'}\nTutor aceptó: ${f.tutorAcepta ? 'Sí' : 'No'}\n` : '') +
        `\nDeclaraciones aceptadas: ${f.aceptaDeclaraciones ? 'Sí' : 'No'}\n` +
        `Firma: ${f.firma || '-'}\n` +
        `Firmada el: ${f.firmadoEl ? new Date(f.firmadoEl).toLocaleDateString('es-MX') : '-'}`
    );
}

function adjustCredits(email) {
    const users = getUsers();
    const user = users[email];
    if (!user) return;
    const input = prompt(`Créditos actuales de ${user.name}: ${user.credits}\nEscribe el nuevo total de créditos:`, user.credits);
    if (input === null) return;
    const value = parseInt(input, 10);
    if (isNaN(value) || value < 0) { alert('Ingresa un número válido.'); return; }
    user.credits = value;
    saveUsers(users);
    renderAdminStudents();
}

/* --- Horarios (admin) --- */

function renderAdminSchedule() {
    const container = document.getElementById('admin-schedule-list');
    if (!container) return;
    const schedule = getSchedule();

    container.innerHTML = schedule.map((s, index) => `
        <div class="admin-row">
            <div><strong>${s.day}</strong> ${s.time} — ${s.discipline}</div>
            <div class="admin-row-actions">
                <button class="btn-secondary sm" onclick="removeScheduleSlot(${index})">Eliminar</button>
            </div>
        </div>
    `).join('');
}

function addScheduleSlot(event) {
    event.preventDefault();
    const day = document.getElementById('admin-schedule-day').value;
    const time = document.getElementById('admin-schedule-time').value;
    const discipline = document.getElementById('admin-schedule-discipline').value;
    if (!day || !time || !discipline) return;

    const schedule = getSchedule();
    schedule.push({ day, time, discipline });
    saveSchedule(schedule);

    renderAdminSchedule();
    renderScheduleTable();
    populateScheduleSelects();
    event.target.reset();
}

function removeScheduleSlot(index) {
    const schedule = getSchedule();
    schedule.splice(index, 1);
    saveSchedule(schedule);
    renderAdminSchedule();
    renderScheduleTable();
    populateScheduleSelects();
}

/* --- Paquetes (admin) --- */

function renderAdminPackages() {
    const container = document.getElementById('admin-packages-list');
    if (!container) return;
    const packages = getPackages();

    container.innerHTML = packages.map((p, index) => `
        <div class="admin-row">
            <div><strong>${p.nombre}</strong> — ${money(p.precio)} (${p.creditos >= 999 ? '∞' : p.creditos} créditos)</div>
            <div class="admin-row-actions">
                <button class="btn-secondary sm" onclick="editPackage(${index})">Editar</button>
            </div>
        </div>
    `).join('');
}

function editPackage(index) {
    const packages = getPackages();
    const pkg = packages[index];
    const newPrice = prompt(`Nuevo precio para "${pkg.nombre}" (MXN):`, pkg.precio);
    if (newPrice === null) return;
    const newCredits = prompt(`Créditos que otorga "${pkg.nombre}" (usa 999 para ilimitado):`, pkg.creditos);
    if (newCredits === null) return;

    pkg.precio = parseFloat(newPrice) || pkg.precio;
    pkg.creditos = parseInt(newCredits, 10) || pkg.creditos;
    savePackages(packages);
    renderAdminPackages();
}

function addDisciplineFromAdmin(event) {
    event.preventDefault();
    const input = document.getElementById('admin-new-discipline');
    const name = input.value.trim();
    if (!name) return;
    const disciplines = getDisciplines();
    if (!disciplines.includes(name)) {
        disciplines.push(name);
        saveDisciplines(disciplines);
        populateDisciplineSelects();
    }
    input.value = '';
}
