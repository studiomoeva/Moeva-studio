/* ==========================================================================
   MOÉVA — Lógica del sitio (conectado a Supabase)
   Los datos (alumnas, reservas, compras, horarios, paquetes) viven en una
   base de datos real en Supabase, compartida entre todos los dispositivos.
   Las contraseñas se guardan con hash (no en texto plano). El acceso de
   staff usa un token de sesión temporal (12 horas) en vez de reenviar la
   contraseña en cada acción.
   ========================================================================== */

/* --- DIAGNÓSTICO TEMPORAL: muestra cualquier error en pantalla (quitar después) --- */
window.addEventListener('error', function (e) {
    alert('ERROR DETECTADO:\n' + e.message + '\n(línea ' + e.lineno + ')');
});

const SUPABASE_URL = 'https://pizpweghuneuzxtfpiqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpenB3ZWdodW5ldXp4dGZwaXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MTY3MDMsImV4cCI6MjEwMDI5MjcwM30.bKtjGt2v6h3wyDiIu4VsLA39cHgONsrVYoJ4UKLFW4g';

let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    alert('Conexión a Supabase inicializada correctamente ✓');
} catch (e) {
    alert('FALLÓ al crear el cliente de Supabase:\n' + e.message);
}

const SESSION_KEY = 'moeva_session_email';
const ADMIN_TOKEN_KEY = 'moeva_admin_token';

/* Caché en memoria de la alumna actual y del contenido público del sitio */
let CURRENT_STUDENT = null;
let PACKAGES = [];
let SCHEDULE = [];
let DISCIPLINES = [];
const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/* ------------------------------ Utilidades ------------------------------ */

function money(n) {
    return '$' + Number(n).toLocaleString('es-MX') + ' MXN';
}

function getMembershipStatus(user) {
    return user.membership_status || 'pendiente';
}

async function callRPC(name, params) {
    const { data, error } = await supabase.rpc(name, params);
    if (error) throw error;
    return data;
}

function friendlyError(e) {
    return (e && e.message) ? e.message : 'Ocurrió un error. Intenta de nuevo.';
}

/* --------------------------- Contenido público --------------------------- */

async function loadAppContent() {
    const { data, error } = await supabase.from('app_content').select('key,value');
    if (error) { console.error(error); return; }
    for (const row of data) {
        if (row.key === 'packages') PACKAGES = row.value;
        if (row.key === 'schedule') SCHEDULE = row.value;
        if (row.key === 'disciplines') DISCIPLINES = row.value;
    }
}

/* --------------------------- Inicialización --------------------------- */

document.addEventListener('DOMContentLoaded', async () => {
    await loadAppContent();
    renderScheduleTable();
    populateDisciplineSelects();
    populateScheduleSelects();
    populatePackageOptions();
    populateGuestPackageOptions();

    // Sesión de alumna (si ya había iniciado sesión en este navegador)
    const savedEmail = localStorage.getItem(SESSION_KEY);
    if (savedEmail) {
        try {
            const student = await callRPC('get_student', { p_email: savedEmail });
            if (student) {
                CURRENT_STUDENT = student;
                showDashboard(student);
            } else {
                localStorage.removeItem(SESSION_KEY);
            }
        } catch (e) {
            localStorage.removeItem(SESSION_KEY);
        }
    }

    // Sesión de staff (token guardado en esta pestaña/navegador)
    const savedToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (savedToken) {
        try {
            await callRPC('admin_list_students', { p_token: savedToken });
            showAdminPanel();
        } catch (e) {
            sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        }
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

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    try {
        const student = await callRPC('login_student', { p_email: email, p_password: password });
        if (!student) {
            alert('Correo o contraseña incorrectos.');
            return;
        }
        CURRENT_STUDENT = student;
        localStorage.setItem(SESSION_KEY, email);
        showDashboard(student);
        event.target.reset();
    } catch (e) {
        alert(friendlyError(e));
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const phone = document.getElementById('reg-phone').value.trim();
    const birthday = document.getElementById('reg-birthday').value;

    try {
        const student = await callRPC('register_student', {
            p_name: name, p_email: email, p_password: password, p_phone: phone, p_birthday: birthday
        });
        CURRENT_STUDENT = student;
        localStorage.setItem(SESSION_KEY, email);
        showDashboard(student);
        event.target.reset();
        alert('¡Cuenta creada! Antes de tomar tu primera clase, completa tu ficha médica y firma el reglamento desde tu panel. Recuerda que la afiliación anual tiene un costo de $550 MXN, puedes pagarla en el estudio o por transferencia.');
    } catch (e) {
        alert(friendlyError(e));
    }
}

function handleLogout() {
    CURRENT_STUDENT = null;
    localStorage.removeItem(SESSION_KEY);
    document.getElementById('student-dashboard').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('login-form').reset();
}

/* ------------------------------ Dashboard ------------------------------ */

function currentUser() {
    return CURRENT_STUDENT;
}

async function refreshCurrentStudent() {
    if (!CURRENT_STUDENT) return;
    const student = await callRPC('get_student', { p_email: CURRENT_STUDENT.email });
    CURRENT_STUDENT = student;
}

function showDashboard(user) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');
    document.getElementById('user-display-name').textContent = user.name;
    renderDashboard();
}

async function renderDashboard() {
    const user = currentUser();
    if (!user) return;

    document.getElementById('credit-count').textContent = user.credits >= 999 ? '∞' : user.credits;

    const medBtn = document.getElementById('medical-status-btn');
    if (medBtn) medBtn.textContent = user.medical_signed ? 'Ver / Actualizar ficha' : 'Completar ficha médica';
    document.getElementById('medical-status-badge').textContent = user.medical_signed ? 'Completa ✓' : 'Pendiente';
    document.getElementById('medical-status-badge').className = 'status-badge ' + (user.medical_signed ? 'status-ok' : 'status-pending');

    document.getElementById('reglamento-status-badge').textContent = user.reglamento_signed ? 'Firmado ✓' : 'Pendiente';
    document.getElementById('reglamento-status-badge').className = 'status-badge ' + (user.reglamento_signed ? 'status-ok' : 'status-pending');

    const membershipStatus = getMembershipStatus(user);
    const membershipLabels = { pagada: 'Pagada ✓', exenta: 'Exenta / promoción ✓', pendiente: 'Pendiente' };
    document.getElementById('membership-status-badge').textContent = membershipLabels[membershipStatus];
    document.getElementById('membership-status-badge').className = 'status-badge ' + (membershipStatus === 'pendiente' ? 'status-pending' : 'status-ok');
    document.getElementById('membership-status-note').textContent = user.membership_note ? `(${user.membership_note})` : '';

    // Reservas
    const list = document.getElementById('reservations-list');
    list.innerHTML = '<li class="empty-state">Cargando...</li>';
    try {
        const reservations = await callRPC('get_my_reservations', { p_email: user.email });
        list.innerHTML = '';
        if (!reservations || reservations.length === 0) {
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
    } catch (e) {
        list.innerHTML = '<li class="empty-state">No se pudieron cargar tus reservas.</li>';
    }
}

/* ------------------------------ Reservar clase (alumna) ------------------------------ */

function openBookingModal() {
    const user = currentUser();
    if (!user) return;
    if (!user.reglamento_signed || !user.medical_signed) {
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

async function handleBooking(event) {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;

    const scheduleId = document.getElementById('book-slot').value;
    if (!scheduleId) { alert('Elige un horario.'); return; }
    const [day, time, discipline] = scheduleId.split('|');

    try {
        await callRPC('create_reservation', {
            p_email: user.email, p_guest_name: null, p_guest_phone: null, p_guest_email: null,
            p_discipline: discipline, p_day: day, p_time: time, p_is_guest: false,
            p_package_id: null, p_payment_method: null
        });
        await refreshCurrentStudent();
        closeBookingModal();
        renderDashboard();
        alert('¡Clase reservada con éxito!');
    } catch (e) {
        alert(friendlyError(e));
    }
}

async function cancelBooking(id) {
    const user = currentUser();
    if (!user) return;
    try {
        await callRPC('cancel_reservation', { p_id: id, p_email: user.email });
        await refreshCurrentStudent();
        renderDashboard();
        alert('Clase cancelada. Tu crédito ha sido restituido.');
    } catch (e) {
        alert(friendlyError(e));
    }
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

    if (user.medical_form) {
        const m = user.medical_form;
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

async function saveMedicalForm(event) {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;
    const form = event.target;
    const isMinor = form.elements['med-is-minor'].checked;

    const condiciones = [...form.elements['med-cond']]
        .filter(c => c.checked)
        .map(c => c.value);

    const medicalForm = {
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

    try {
        await callRPC('save_medical_form', { p_email: user.email, p_form: medicalForm });
        await refreshCurrentStudent();
        closeMedicalForm();
        renderDashboard();
        alert('¡Ficha médica guardada correctamente en tu expediente!');
    } catch (e) {
        alert(friendlyError(e));
    }
}

/* ------------------------------ Reglamento ------------------------------ */

function openReglamentoModal() {
    document.getElementById('reglamento-modal').classList.remove('hidden');
}
function closeReglamentoModal() { document.getElementById('reglamento-modal').classList.add('hidden'); }

async function acceptReglamento() {
    const user = currentUser();
    if (!user) { closeReglamentoModal(); return; }
    try {
        await callRPC('accept_reglamento', { p_email: user.email });
        await refreshCurrentStudent();
        closeReglamentoModal();
        renderDashboard();
        alert('Has aceptado el reglamento interno.');
    } catch (e) {
        alert(friendlyError(e));
    }
}

/* ------------------------------ Compra de paquetes ------------------------------ */

function populatePackageOptions() {
    const select = document.getElementById('checkout-package');
    if (!select) return;
    const pole = PACKAGES.filter(p => p.categoria !== 'ritmos');
    const ritmos = PACKAGES.filter(p => p.categoria === 'ritmos');
    select.innerHTML =
        `<optgroup label="Pole y Disciplinas">` +
        pole.map(p => `<option value="${p.id}">${p.nombre} — ${money(p.precio)}</option>`).join('') +
        `</optgroup>` +
        `<optgroup label="Ritmos Latinos">` +
        ritmos.map(p => `<option value="${p.id}">${p.nombre} — ${money(p.precio)}</option>`).join('') +
        `</optgroup>`;
}

function openCheckoutModal() {
    populatePackageOptions();
    document.getElementById('checkout-modal').classList.remove('hidden');
}
function closeCheckoutModal() { document.getElementById('checkout-modal').classList.add('hidden'); }

async function handleCheckout(event) {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;

    const packageId = document.getElementById('checkout-package').value;
    const paymentMethod = document.getElementById('checkout-payment').value;
    const pkg = PACKAGES.find(p => p.id === packageId);
    if (!pkg) return;

    try {
        await callRPC('request_purchase', {
            p_email: user.email, p_guest_name: null, p_guest_phone: null,
            p_package_id: packageId, p_payment_method: paymentMethod, p_is_guest: false
        });
        closeCheckoutModal();
        if (paymentMethod === 'transferencia') {
            alert('Elegiste pagar por transferencia. Escríbenos por WhatsApp (222 469 4805) para enviarte los datos bancarios y comparte tu comprobante. Tus créditos se activarán cuando confirmemos el pago.');
        } else {
            alert(`Elegiste pagar ${pkg.nombre} (${money(pkg.precio)}) en el estudio con ${paymentMethod}. Tus créditos se activarán cuando el staff confirme tu pago en recepción.`);
        }
    } catch (e) {
        alert(friendlyError(e));
    }
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
    const packages = PACKAGES.filter(p => p.id === 'muestra' || p.id === 'suelta');
    select.innerHTML = packages.map(p =>
        `<option value="${p.id}">${p.nombre} — ${money(p.precio)}</option>`
    ).join('');
}

async function handleGuestBooking(event) {
    event.preventDefault();
    const name = document.getElementById('guest-name').value.trim();
    const phone = document.getElementById('guest-phone').value.trim();
    const email = document.getElementById('guest-email').value.trim();
    const packageId = document.getElementById('guest-package').value;
    const scheduleId = document.getElementById('guest-slot').value;
    const paymentMethod = document.getElementById('guest-payment').value;

    if (!scheduleId) { alert('Elige un horario.'); return; }
    const [day, time, discipline] = scheduleId.split('|');
    const pkg = PACKAGES.find(p => p.id === packageId);

    try {
        await callRPC('create_reservation', {
            p_email: null, p_guest_name: name, p_guest_phone: phone, p_guest_email: email || null,
            p_discipline: discipline, p_day: day, p_time: time, p_is_guest: true,
            p_package_id: packageId, p_payment_method: paymentMethod
        });
        closeGuestModal();
        event.target.reset();
        if (paymentMethod === 'transferencia') {
            alert('¡Reserva registrada! Escríbenos por WhatsApp (222 469 4805) para los datos de transferencia y envíanos tu comprobante para confirmar tu lugar.');
        } else {
            alert(`¡Reserva registrada! Paga tu ${pkg.nombre} (${money(pkg.precio)}) con ${paymentMethod} directamente al llegar al estudio.`);
        }
    } catch (e) {
        alert(friendlyError(e));
    }
}

/* ------------------------------ Horario público (dinámico) ------------------------------ */

function renderScheduleTable() {
    const mainSchedule = SCHEDULE.filter(s => s.discipline !== 'Ritmos Latinos');
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

    const ritmos = SCHEDULE.filter(s => s.discipline === 'Ritmos Latinos');
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
    const options = SCHEDULE.map(s =>
        `<option value="${s.day}|${s.time}|${s.discipline}">${s.day} ${s.time} — ${s.discipline}</option>`
    ).join('');

    const bookSlot = document.getElementById('book-slot');
    if (bookSlot) bookSlot.innerHTML = '<option value="">Selecciona un horario</option>' + options;

    const guestSlot = document.getElementById('guest-slot');
    if (guestSlot) guestSlot.innerHTML = '<option value="">Selecciona un horario</option>' + options;
}

function populateDisciplineSelects() {
    const select = document.getElementById('admin-schedule-discipline');
    if (select) {
        select.innerHTML = DISCIPLINES.map(d => `<option value="${d}">${d}</option>`).join('');
    }
}

/* ==========================================================================
   PANEL DE ADMINISTRACIÓN (staff)
   ========================================================================== */

function getAdminToken() {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

function openAdminLogin() {
    document.getElementById('admin-login-modal').classList.remove('hidden');
}
function closeAdminLogin() { document.getElementById('admin-login-modal').classList.add('hidden'); }

async function handleAdminLogin(event) {
    event.preventDefault();
    const email = document.getElementById('admin-email').value.trim().toLowerCase();
    const password = document.getElementById('admin-password').value;

    try {
        const token = await callRPC('admin_login', { p_email: email, p_password: password });
        if (!token) {
            alert('Credenciales de administración incorrectas.');
            return;
        }
        sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
        closeAdminLogin();
        showAdminPanel();
        event.target.reset();
    } catch (e) {
        alert('Credenciales de administración incorrectas.');
    }
}

async function handleAdminLogout() {
    const token = getAdminToken();
    if (token) {
        try { await callRPC('admin_logout', { p_token: token }); } catch (e) { /* no-op */ }
    }
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
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

async function renderAdminReservations() {
    const container = document.getElementById('admin-reservations-list');
    if (!container) return;
    const token = getAdminToken();
    if (!token) return;

    container.innerHTML = '<p class="empty-state">Cargando...</p>';
    try {
        const reservations = await callRPC('admin_list_reservations', { p_token: token });

        if (!reservations || reservations.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay reservas registradas.</p>';
            return;
        }

        container.innerHTML = reservations.map(r => {
            const who = r.is_guest ? `${r.guest_name} (invitada — ${r.guest_phone || 's/tel'})` : (r.student_email || 's/correo');
            return `
            <div class="admin-row">
                <div>
                    <strong>${who}</strong><br>
                    <span>${r.discipline} — ${r.day} ${r.time}</span><br>
                    <span class="status-badge status-ok">${r.status}</span>
                    ${r.payment_method ? `<span class="muted"> · pago: ${r.payment_method}</span>` : ''}
                </div>
                <div class="admin-row-actions">
                    <button class="btn-secondary sm" onclick="adminCancelReservation('${r.id}')">Cancelar</button>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        container.innerHTML = `<p class="empty-state">${friendlyError(e)}</p>`;
    }
}

async function adminCancelReservation(id) {
    const token = getAdminToken();
    if (!token) return;
    try {
        await callRPC('admin_cancel_reservation', { p_token: token, p_id: id });
        renderAdminReservations();
        renderAdminStudents();
    } catch (e) {
        alert(friendlyError(e));
    }
}

/* --- Compras pendientes de confirmación (admin) --- */

async function renderAdminPurchases() {
    const container = document.getElementById('admin-purchases-list');
    if (!container) return;
    const token = getAdminToken();
    if (!token) return;

    container.innerHTML = '<p class="empty-state">Cargando...</p>';
    try {
        const purchases = await callRPC('admin_list_purchases', { p_token: token });
        const pending = (purchases || []).filter(p => p.status === 'pendiente');

        if (pending.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay pagos pendientes de confirmar.</p>';
            return;
        }

        container.innerHTML = pending.map(p => `
            <div class="admin-row">
                <div>
                    <strong>${p.is_guest ? p.guest_name + ' (invitada)' : p.student_email}</strong><br>
                    <span>${p.package_name} — ${money(p.price)} (${p.credits >= 999 ? '∞' : p.credits} créditos)</span><br>
                    <span class="muted">pago: ${p.payment_method}</span>
                </div>
                <div class="admin-row-actions">
                    <button class="btn-primary sm" onclick="confirmPurchase('${p.id}')">Confirmar pago</button>
                </div>
            </div>`
        ).join('');
    } catch (e) {
        container.innerHTML = `<p class="empty-state">${friendlyError(e)}</p>`;
    }
}

async function confirmPurchase(id) {
    const token = getAdminToken();
    if (!token) return;
    try {
        await callRPC('admin_confirm_purchase', { p_token: token, p_id: id });
        renderAdminPurchases();
        renderAdminStudents();
        if (currentUser()) { await refreshCurrentStudent(); renderDashboard(); }
        alert('Pago confirmado y créditos aplicados a la cuenta de la alumna.');
    } catch (e) {
        alert(friendlyError(e));
    }
}

/* --- Alumnas (admin) --- */

async function renderAdminStudents() {
    const container = document.getElementById('admin-students-list');
    if (!container) return;
    const token = getAdminToken();
    if (!token) return;

    container.innerHTML = '<p class="empty-state">Cargando...</p>';
    try {
        const students = await callRPC('admin_list_students', { p_token: token });

        if (!students || students.length === 0) {
            container.innerHTML = '<p class="empty-state">Todavía no hay alumnas registradas.</p>';
            return;
        }

        container.innerHTML = students.map(s => {
            const membershipStatus = getMembershipStatus(s);
            const membershipLabels = { pagada: 'Afiliación: Pagada', exenta: 'Afiliación: Exenta/promoción', pendiente: 'Afiliación: Pendiente' };
            return `
            <div class="admin-row admin-row-student">
                <div>
                    <strong>${s.name}</strong><br>
                    <span class="muted">${s.email} · ${s.phone || 'sin teléfono'} · ${s.birthday ? 'cumpleaños: ' + s.birthday : 'sin fecha de nacimiento'}</span><br>
                    <span class="status-badge ${s.medical_signed ? 'status-ok' : 'status-pending'}">Ficha médica: ${s.medical_signed ? 'Completa' : 'Pendiente'}</span>
                    <span class="status-badge ${s.reglamento_signed ? 'status-ok' : 'status-pending'}">Reglamento: ${s.reglamento_signed ? 'Firmado' : 'Pendiente'}</span>
                    <span class="status-badge ${membershipStatus === 'pendiente' ? 'status-pending' : 'status-ok'}">${membershipLabels[membershipStatus]}${s.membership_note ? ' — ' + s.membership_note : ''}</span>
                    <span class="muted">· Créditos: ${s.credits >= 999 ? '∞' : s.credits}</span>
                </div>
                <div class="admin-row-actions">
                    <button class="btn-secondary sm" onclick="viewMedicalFile('${s.email}')">Ver ficha médica</button>
                    <button class="btn-secondary sm" onclick="adjustCredits('${s.email}', ${s.credits})">Ajustar créditos</button>
                    <button class="btn-secondary sm" onclick="setMembershipStatus('${s.email}', '${membershipStatus}', '${(s.membership_note || '').replace(/'/g, "\\'")}')">Afiliación</button>
                    <button class="btn-secondary sm btn-danger" onclick="deleteStudent('${s.email}', '${s.name.replace(/'/g, "\\'")}')">Borrar alumna</button>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        container.innerHTML = `<p class="empty-state">${friendlyError(e)}</p>`;
    }
}

async function setMembershipStatus(email, currentStatus, currentNote) {
    const token = getAdminToken();
    if (!token) return;

    const opciones = '1 = Pendiente\n2 = Pagada\n3 = Exenta / promoción (cortesía, descuento, etc.)';
    const map = { pendiente: '1', pagada: '2', exenta: '3' };
    const choice = prompt(`Afiliación de ${email}:\n${opciones}\n\nEscribe 1, 2 o 3:`, map[currentStatus] || '1');
    if (choice === null) return;

    const reverseMap = { '1': 'pendiente', '2': 'pagada', '3': 'exenta' };
    const nuevoEstatus = reverseMap[choice.trim()];
    if (!nuevoEstatus) {
        alert('Opción no válida. Escribe 1, 2 o 3.');
        return;
    }

    let nota = currentNote || '';
    if (nuevoEstatus === 'exenta' || nuevoEstatus === 'pagada') {
        const notaInput = prompt('Nota opcional (ej. "Promoción verano 2026", "50% descuento", "Cortesía"):', nota);
        if (notaInput !== null) nota = notaInput.trim();
    } else {
        nota = '';
    }

    try {
        await callRPC('admin_set_membership', { p_token: token, p_student_email: email, p_status: nuevoEstatus, p_note: nota });
        renderAdminStudents();
        if (currentUser() && currentUser().email === email) { await refreshCurrentStudent(); renderDashboard(); }
        alert('Estatus de afiliación actualizado.');
    } catch (e) {
        alert(friendlyError(e));
    }
}

async function deleteStudent(email, name) {
    const confirmado = confirm(`¿Seguro que quieres borrar a "${name}" (${email})?\n\nEsto elimina su cuenta, ficha médica, créditos y reservas. Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    const token = getAdminToken();
    if (!token) return;
    try {
        await callRPC('admin_delete_student', { p_token: token, p_student_email: email });
        renderAdminStudents();
        renderAdminPurchases();
        renderAdminReservations();
        alert('Alumna eliminada correctamente.');
    } catch (e) {
        alert(friendlyError(e));
    }
}

async function viewMedicalFile(email) {
    const token = getAdminToken();
    if (!token) return;
    try {
        const user = await callRPC('admin_view_medical_file', { p_token: token, p_student_email: email });
        if (!user || !user.medical_form) {
            alert('Esta alumna todavía no ha llenado su ficha médica.');
            return;
        }
        const f = user.medical_form;
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
    } catch (e) {
        alert(friendlyError(e));
    }
}

async function adjustCredits(email, currentCredits) {
    const token = getAdminToken();
    if (!token) return;
    const input = prompt(`Créditos actuales de ${email}: ${currentCredits}\nEscribe el nuevo total de créditos:`, currentCredits);
    if (input === null) return;
    const value = parseInt(input, 10);
    if (isNaN(value) || value < 0) { alert('Ingresa un número válido.'); return; }
    try {
        await callRPC('admin_adjust_credits', { p_token: token, p_student_email: email, p_credits: value });
        renderAdminStudents();
        if (currentUser() && currentUser().email === email) { await refreshCurrentStudent(); renderDashboard(); }
    } catch (e) {
        alert(friendlyError(e));
    }
}

/* --- Horarios (admin) --- */

function renderAdminSchedule() {
    const container = document.getElementById('admin-schedule-list');
    if (!container) return;

    container.innerHTML = SCHEDULE.map((s, index) => `
        <div class="admin-row">
            <div><strong>${s.day}</strong> ${s.time} — ${s.discipline}</div>
            <div class="admin-row-actions">
                <button class="btn-secondary sm" onclick="removeScheduleSlot(${index})">Eliminar</button>
            </div>
        </div>
    `).join('');
}

async function saveScheduleToServer() {
    const token = getAdminToken();
    if (!token) return;
    await callRPC('admin_update_content', { p_token: token, p_key: 'schedule', p_value: SCHEDULE });
}

async function addScheduleSlot(event) {
    event.preventDefault();
    const day = document.getElementById('admin-schedule-day').value;
    const time = document.getElementById('admin-schedule-time').value;
    const discipline = document.getElementById('admin-schedule-discipline').value;
    if (!day || !time || !discipline) return;

    SCHEDULE.push({ day, time, discipline });
    try {
        await saveScheduleToServer();
        renderAdminSchedule();
        renderScheduleTable();
        populateScheduleSelects();
        event.target.reset();
    } catch (e) {
        SCHEDULE.pop();
        alert(friendlyError(e));
    }
}

async function removeScheduleSlot(index) {
    const removed = SCHEDULE.splice(index, 1);
    try {
        await saveScheduleToServer();
        renderAdminSchedule();
        renderScheduleTable();
        populateScheduleSelects();
    } catch (e) {
        SCHEDULE.splice(index, 0, removed[0]);
        alert(friendlyError(e));
    }
}

/* --- Paquetes (admin) --- */

function renderAdminPackages() {
    const container = document.getElementById('admin-packages-list');
    if (!container) return;
    const pole = PACKAGES.map((p, i) => ({ p, i })).filter(x => x.p.categoria !== 'ritmos');
    const ritmos = PACKAGES.map((p, i) => ({ p, i })).filter(x => x.p.categoria === 'ritmos');

    const fila = ({ p, i }) => `
        <div class="admin-row">
            <div><strong>${p.nombre}</strong> — ${money(p.precio)} (${p.creditos >= 999 ? '∞' : p.creditos} créditos)</div>
            <div class="admin-row-actions">
                <button class="btn-secondary sm" onclick="editPackage(${i})">Editar</button>
            </div>
        </div>`;

    container.innerHTML =
        `<h4 class="admin-subheading">Pole y Disciplinas</h4>` +
        pole.map(fila).join('') +
        `<h4 class="admin-subheading">Ritmos Latinos</h4>` +
        ritmos.map(fila).join('');
}

async function editPackage(index) {
    const token = getAdminToken();
    if (!token) return;
    const pkg = PACKAGES[index];
    const newPrice = prompt(`Nuevo precio para "${pkg.nombre}" (MXN):`, pkg.precio);
    if (newPrice === null) return;
    const newCredits = prompt(`Créditos que otorga "${pkg.nombre}" (usa 999 para ilimitado):`, pkg.creditos);
    if (newCredits === null) return;

    const backup = { ...pkg };
    pkg.precio = parseFloat(newPrice) || pkg.precio;
    pkg.creditos = parseInt(newCredits, 10) || pkg.creditos;

    try {
        await callRPC('admin_update_content', { p_token: token, p_key: 'packages', p_value: PACKAGES });
        renderAdminPackages();
        populatePackageOptions();
        populateGuestPackageOptions();
    } catch (e) {
        PACKAGES[index] = backup;
        alert(friendlyError(e));
    }
}

async function addDisciplineFromAdmin(event) {
    event.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    const input = document.getElementById('admin-new-discipline');
    const name = input.value.trim();
    if (!name) return;
    if (DISCIPLINES.includes(name)) { input.value = ''; return; }

    DISCIPLINES.push(name);
    try {
        await callRPC('admin_update_content', { p_token: token, p_key: 'disciplines', p_value: DISCIPLINES });
        populateDisciplineSelects();
        input.value = '';
    } catch (e) {
        DISCIPLINES.pop();
        alert(friendlyError(e));
    }
}
