// ========== CONFIGURATION ==========
const API_URL = 'http://localhost:5000/api';

// ========== GLOBAL VARIABLES ==========
let currentPatientId = null;
let currentAdmin = null;

// ========== UTILITY FUNCTIONS ==========

function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.innerHTML = `<div class="${isError ? 'error' : 'success'}">${message}</div>`;
    setTimeout(() => {
        if (element) element.innerHTML = '';
    }, 3000);
}

function hideAllSections() {
    const sections = [
        'main-menu', 'register-form', 'login-form', 'admin-login-form',
        'patient-dashboard', 'admin-dashboard', 'doctors-list', 
        'book-form', 'my-appointments', 'add-doctor-form'
    ];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function backToMenu() {
    hideAllSections();
    document.getElementById('main-menu').style.display = 'block';
}

function backToPatientDashboard() {
    hideAllSections();
    document.getElementById('patient-dashboard').style.display = 'block';
    document.getElementById('dashboard-content').innerHTML = '';
}

function backToAdminDashboard() {
    hideAllSections();
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('admin-content').innerHTML = '';
}

function logout() {
    currentPatientId = null;
    currentAdmin = null;
    backToMenu();
}

// ========== PATIENT FUNCTIONS ==========

function showRegister() {
    hideAllSections();
    document.getElementById('register-form').style.display = 'block';
}

function register() {
    const data = {
        name: document.getElementById('reg-name').value,
        phone: document.getElementById('reg-phone').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        age: document.getElementById('reg-age').value,
        gender: document.getElementById('reg-gender').value,
        address: document.getElementById('reg-address').value
    };
    
    if (!data.name || !data.phone || !data.email || !data.password) {
        showMessage('reg-message', 'Please fill all required fields!', true);
        return;
    }
    
    if (!/^\d{10}$/.test(data.phone)) {
        showMessage('reg-message', 'Phone number must be 10 digits!', true);
        return;
    }
    
    fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            showMessage('reg-message', `✅ Registration successful! Your Patient ID: ${result.patient_id}`);
            setTimeout(() => backToMenu(), 2000);
        } else {
            showMessage('reg-message', `❌ ${result.error}`, true);
        }
    })
    .catch(err => {
        showMessage('reg-message', `❌ Connection error: ${err.message}`, true);
    });
}

function showLogin() {
    hideAllSections();
    document.getElementById('login-form').style.display = 'block';
}

function login() {
    const data = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    };
    
    if (!data.email || !data.password) {
        showMessage('login-message', 'Please enter email and password!', true);
        return;
    }
    
    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            currentPatientId = result.patient.patient_id;
            hideAllSections();
            document.getElementById('patient-dashboard').style.display = 'block';
            document.getElementById('dashboard-content').innerHTML = `<h3>Welcome, ${result.patient.name}! 🎉</h3>`;
        } else {
            showMessage('login-message', `❌ ${result.error}`, true);
        }
    })
    .catch(err => {
        showMessage('login-message', `❌ Connection error: ${err.message}`, true);
    });
}

function showDoctors() {
    hideAllSections();
    document.getElementById('doctors-list').style.display = 'block';
    
    fetch(`${API_URL}/doctors`)
        .then(res => res.json())
        .then(doctors => {
            let html = '';
            if (doctors.length === 0) {
                html = '<p>No doctors available.</p>';
            } else {
                doctors.forEach(doc => {
                    html += `
                        <div class="doctor-card">
                            <h3>👨‍⚕️ Dr. ${doc.name}</h3>
                            <p><strong>Specialization:</strong> ${doc.specialization}</p>
                            <p><strong>Consultation Fee:</strong> ₹${doc.fee}</p>
                        </div>
                    `;
                });
            }
            document.getElementById('doctors-content').innerHTML = html;
        })
        .catch(err => {
            document.getElementById('doctors-content').innerHTML = `<div class="error">Error loading doctors: ${err.message}</div>`;
        });
}

function showBookAppointment() {
    hideAllSections();
    document.getElementById('book-form').style.display = 'block';
    
    fetch(`${API_URL}/doctors`)
        .then(res => res.json())
        .then(doctors => {
            let options = '<option value="">Select Doctor</option>';
            doctors.forEach(doc => {
                options += `<option value="${doc.doctor_id}">Dr. ${doc.name} - ${doc.specialization} (₹${doc.fee})</option>`;
            });
            document.getElementById('book-doctor').innerHTML = options;
        });
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('book-date').min = today;
}

function bookAppointment() {
    const data = {
        patient_id: currentPatientId,
        doctor_id: document.getElementById('book-doctor').value,
        date: document.getElementById('book-date').value,
        time: document.getElementById('book-time').value,
        symptoms: document.getElementById('book-symptoms').value
    };
    
    if (!data.doctor_id || !data.date || !data.time) {
        showMessage('book-message', 'Please select doctor, date and time!', true);
        return;
    }
    
    fetch(`${API_URL}/book`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            showMessage('book-message', '✅ Appointment booked successfully!');
            setTimeout(() => backToPatientDashboard(), 1500);
        } else {
            showMessage('book-message', `❌ ${result.error}`, true);
        }
    })
    .catch(err => {
        showMessage('book-message', `❌ Error: ${err.message}`, true);
    });
}

function showMyAppointments() {
    hideAllSections();
    document.getElementById('my-appointments').style.display = 'block';
    
    fetch(`${API_URL}/appointments/${currentPatientId}`)
        .then(res => res.json())
        .then(appointments => {
            let html = '';
            if (appointments.length === 0) {
                html = '<p>No appointments found. Book your first appointment!</p>';
            } else {
                appointments.forEach(app => {
                    const statusIcon = app.status === 'Completed' ? '✅' : 
                                     app.status === 'Cancelled' ? '❌' : '📅';
                    html += `
                        <div class="appointment-card">
                            <h3>${statusIcon} Dr. ${app.doctor_name}</h3>
                            <p><strong>Specialization:</strong> ${app.specialization}</p>
                            <p><strong>Date & Time:</strong> ${app.appointment_date} at ${app.appointment_time}</p>
                            <p><strong>Status:</strong> ${app.status}</p>
                            ${app.symptoms ? `<p><strong>Symptoms:</strong> ${app.symptoms}</p>` : ''}
                            ${app.status === 'Pending' ? 
                                `<button onclick="cancelAppointment(${app.appointment_id})" class="cancel-btn">Cancel Appointment</button>` : ''}
                        </div>
                    `;
                });
            }
            document.getElementById('appointments-list').innerHTML = html;
        })
        .catch(err => {
            document.getElementById('appointments-list').innerHTML = `<div class="error">Error: ${err.message}</div>`;
        });
}

function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        fetch(`${API_URL}/cancel/${appointmentId}`, {method: 'DELETE'})
            .then(() => {
                showMyAppointments();
            })
            .catch(err => {
                alert('Error cancelling appointment: ' + err.message);
            });
    }
}

// ========== ADMIN FUNCTIONS ==========

function showAdminLogin() {
    hideAllSections();
    document.getElementById('admin-login-form').style.display = 'block';
}

function adminLogin() {
    const data = {
        username: document.getElementById('admin-username').value,
        password: document.getElementById('admin-password').value
    };
    
    if (!data.username || !data.password) {
        showMessage('admin-message', 'Please enter username and password!', true);
        return;
    }
    
    fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            currentAdmin = result.admin;
            hideAllSections();
            document.getElementById('admin-dashboard').style.display = 'block';
            document.getElementById('admin-content').innerHTML = `<h3>Welcome, ${result.admin.username}! 👑</h3>`;
        } else {
            showMessage('admin-message', `❌ ${result.error}`, true);
        }
    })
    .catch(err => {
        showMessage('admin-message', `❌ Error: ${err.message}`, true);
    });
}

function showAddDoctor() {
    hideAllSections();
    document.getElementById('add-doctor-form').style.display = 'block';
}

function addDoctor() {
    const data = {
        name: document.getElementById('doc-name').value,
        specialization: document.getElementById('doc-specialization').value,
        phone: document.getElementById('doc-phone').value,
        email: document.getElementById('doc-email').value,
        fee: document.getElementById('doc-fee').value,
        experience: document.getElementById('doc-experience').value
    };
    
    if (!data.name || !data.specialization || !data.phone || !data.fee || !data.experience) {
        showMessage('add-doctor-message', 'Please fill all required fields!', true);
        return;
    }
    
    fetch(`${API_URL}/doctors/add`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            showMessage('add-doctor-message', '✅ Doctor added successfully!');
            setTimeout(() => backToAdminDashboard(), 1500);
        } else {
            showMessage('add-doctor-message', `❌ ${result.error}`, true);
        }
    })
    .catch(err => {
        showMessage('add-doctor-message', `❌ Error: ${err.message}`, true);
    });
}

function showAllAppointments() {
    fetch(`${API_URL}/all-appointments`)
        .then(res => res.json())
        .then(appointments => {
            let html = '<h3>📋 All Appointments</h3>';
            if (appointments.length === 0) {
                html += '<p>No appointments found.</p>';
            } else {
                appointments.forEach(app => {
                    html += `
                        <div class="appointment-card">
                            <p><strong>${app.patient}</strong> with <strong>Dr. ${app.doctor}</strong></p>
                            <p>📅 ${app.appointment_date} at ${app.appointment_time}</p>
                            <p>Status: ${app.status}</p>
                        </div>
                    `;
                });
            }
            document.getElementById('admin-content').innerHTML = html;
        })
        .catch(err => {
            document.getElementById('admin-content').innerHTML = `<div class="error">Error: ${err.message}</div>`;
        });
}

function showTodayReport() {
    fetch(`${API_URL}/report/today`)
        .then(res => res.json())
        .then(report => {
            document.getElementById('admin-content').innerHTML = `
                <div class="report">
                    <h3>📊 Today's Report</h3>
                    <p>📅 Date: ${new Date().toLocaleDateString()}</p>
                    <p>📊 Total Appointments: ${report.total}</p>
                    <p>✅ Completed: ${report.completed}</p>
                    <p>⏳ Pending: ${report.pending}</p>
                    <p>❌ Cancelled: ${report.cancelled}</p>
                </div>
            `;
        })
        .catch(err => {
            document.getElementById('admin-content').innerHTML = `<div class="error">Error: ${err.message}</div>`;
        });
}