// =================================
// Main Application Controller
// =================================

// Initialize default admin credentials
function initializeDefaultAdmin() {
    const storedAdmin = localStorage.getItem('adminCredentials');
    if (!storedAdmin) {
        const defaultAdmin = {
            username: 'admin',
            password: 'admin123' // In production, this should be hashed
        };
        localStorage.setItem('adminCredentials', JSON.stringify(defaultAdmin));
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultAdmin();
    setupEventListeners();
    checkSession();
});

// Setup all event listeners
function setupEventListeners() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.querySelector('.close');

    loginBtn.addEventListener('click', () => {
        loginModal.classList.add('show');
    });

    closeModal.addEventListener('click', () => {
        loginModal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('show');
        }
    });

    // Login toggle
    const adminLoginTab = document.getElementById('adminLoginTab');
    const studentLoginTab = document.getElementById('studentLoginTab');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const studentLoginForm = document.getElementById('studentLoginForm');

    adminLoginTab.addEventListener('click', () => {
        adminLoginTab.classList.add('active');
        studentLoginTab.classList.remove('active');
        adminLoginForm.style.display = 'flex';
        studentLoginForm.style.display = 'none';
    });

    studentLoginTab.addEventListener('click', () => {
        studentLoginTab.classList.add('active');
        adminLoginTab.classList.remove('active');
        studentLoginForm.style.display = 'flex';
        adminLoginForm.style.display = 'none';
    });

    // Login forms
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    studentLoginForm.addEventListener('submit', handleStudentLogin);

    // Homepage buttons
    document.getElementById('adminGetStarted').addEventListener('click', () => {
        loginModal.classList.add('show');
        adminLoginTab.click();
    });

    document.getElementById('studentGetStarted').addEventListener('click', () => {
        loginModal.classList.add('show');
        studentLoginTab.click();
    });

    // Logout buttons
    document.getElementById('adminLogout').addEventListener('click', logout);
    document.getElementById('studentLogout').addEventListener('click', logout);

    // Navigation
    setupNavigation();
}

// Handle admin login
function handleAdminLogin(e) {
    e.preventDefault();

    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    const adminCredentials = JSON.parse(localStorage.getItem('adminCredentials'));

    if (username === adminCredentials.username && password === adminCredentials.password) {
        const session = {
            userType: 'admin',
            username: username,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentSession', JSON.stringify(session));

        showToast('Login successful! Welcome, Admin.', 'success');
        document.getElementById('loginModal').classList.remove('show');
        showDashboard('admin');
    } else {
        showToast('Invalid username or password', 'error');
    }
}

// Handle student login
function handleStudentLogin(e) {
    e.preventDefault();

    const collegeId = document.getElementById('studentCollegeId').value;

    const students = JSON.parse(localStorage.getItem('students')) || [];
    const student = students.find(s => s.collegeId === collegeId);

    if (student) {
        const session = {
            userType: 'student',
            studentId: student.id,
            collegeId: student.collegeId,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentSession', JSON.stringify(session));

        showToast(`Welcome, ${student.name}!`, 'success');
        document.getElementById('loginModal').classList.remove('show');
        showDashboard('student');
    } else {
        showToast('Student not found. Please check your College ID.', 'error');
    }
}

// Check if user has active session
function checkSession() {
    const session = localStorage.getItem('currentSession');
    if (session) {
        const sessionData = JSON.parse(session);
        showDashboard(sessionData.userType);
    }
}

// Show appropriate dashboard
function showDashboard(userType) {
    const homepage = document.getElementById('homepage');
    const adminDashboard = document.getElementById('adminDashboard');
    const studentDashboard = document.getElementById('studentDashboard');
    const loginBtn = document.getElementById('loginBtn');

    homepage.style.display = 'none';
    loginBtn.style.display = 'none';

    if (userType === 'admin') {
        adminDashboard.style.display = 'block';
        studentDashboard.style.display = 'none';
        // Initialize admin dashboard
        if (window.initAdminDashboard) {
            window.initAdminDashboard();
        }
    } else if (userType === 'student') {
        studentDashboard.style.display = 'block';
        adminDashboard.style.display = 'none';
        // Initialize student dashboard
        if (window.initStudentDashboard) {
            window.initStudentDashboard();
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentSession');

    const homepage = document.getElementById('homepage');
    const adminDashboard = document.getElementById('adminDashboard');
    const studentDashboard = document.getElementById('studentDashboard');
    const loginBtn = document.getElementById('loginBtn');

    homepage.style.display = 'block';
    adminDashboard.style.display = 'none';
    studentDashboard.style.display = 'none';
    loginBtn.style.display = 'block';

    // Reset forms
    document.getElementById('adminLoginForm').reset();
    document.getElementById('studentLoginForm').reset();

    showToast('Logged out successfully', 'success');
}

// Setup navigation for dashboard views
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.getAttribute('data-view');

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding view
            const parentDashboard = item.closest('.dashboard');
            const views = parentDashboard.querySelectorAll('.dashboard-view');

            views.forEach(view => view.classList.remove('active'));

            const targetView = parentDashboard.querySelector(`#${viewName}View`);
            if (targetView) {
                targetView.classList.add('active');

                // Trigger view-specific initializations
                if (viewName === 'register' && window.initRegisterView) {
                    window.initRegisterView();
                } else if (viewName === 'scan' && window.initScanView) {
                    window.initScanView();
                } else if (viewName === 'manage' && window.loadManageStudents) {
                    window.loadManageStudents();
                } else if (viewName === 'records' && window.loadAttendanceRecords) {
                    window.loadAttendanceRecords();
                }
            }
        });
    });
}

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility function to generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Utility function to format date
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Utility function to format time
function formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// Export functions for use in other modules
window.showToast = showToast;
window.generateId = generateId;
window.formatDate = formatDate;
window.formatTime = formatTime;
