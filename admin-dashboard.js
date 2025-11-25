// =================================
// Admin Dashboard Module
// =================================

// Initialize admin dashboard
function initAdminDashboard() {
    updateAdminStats();
    loadRecentActivity();
    populateClassFilter();
}

// Update statistics
function updateAdminStats() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const today = formatDate(new Date());

    // Total students
    document.getElementById('totalStudents').textContent = students.length;

    // Present today
    const presentToday = attendance.filter(a => a.date === today).length;
    document.getElementById('presentToday').textContent = presentToday;

    // Attendance rate (today)
    const rate = students.length > 0 ? ((presentToday / students.length) * 100).toFixed(1) : 0;
    document.getElementById('attendanceRate').textContent = rate + '%';

    // Current date
    const dateObj = new Date();
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('currentDate').textContent = dateObj.toLocaleDateString('en-US', options);
}

// Load recent activity
function loadRecentActivity() {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const recentAttendance = attendance
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

    const listContainer = document.getElementById('recentAttendanceList');

    if (recentAttendance.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No attendance records yet</p>';
        return;
    }

    listContainer.innerHTML = recentAttendance.map(record => `
        <div class="activity-item">
            <div>
                <strong>${record.studentName}</strong>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">
                    ${record.rollNumber} • ${record.class}
                </p>
            </div>
            <div style="text-align: right;">
                <strong>${record.date}</strong>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">${record.time}</p>
            </div>
        </div>
    `).join('');
}

// Populate class filter dropdown
function populateClassFilter() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const classes = [...new Set(students.map(s => s.class))].sort();

    const classFilter = document.getElementById('classFilter');
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = cls;
        classFilter.appendChild(option);
    });
}

// Load attendance records with filters
function loadAttendanceRecords() {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];

    // Get filter values
    const classFilter = document.getElementById('classFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;
    const searchQuery = document.getElementById('studentSearch').value.toLowerCase();

    // Apply filters
    let filteredRecords = attendance.filter(record => {
        // Class filter
        if (classFilter && record.class !== classFilter) return false;

        // Date range filter
        if (dateFrom && record.date < dateFrom) return false;
        if (dateTo && record.date > dateTo) return false;

        // Search filter
        if (searchQuery) {
            const nameMatch = record.studentName.toLowerCase().includes(searchQuery);
            const rollMatch = record.rollNumber.toLowerCase().includes(searchQuery);
            if (!nameMatch && !rollMatch) return false;
        }

        return true;
    });

    // Sort by date and time (newest first)
    filteredRecords.sort((a, b) => b.timestamp - a.timestamp);

    // Display records
    const tbody = document.getElementById('recordsTableBody');

    if (filteredRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No records found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredRecords.map(record => `
        <tr>
            <td>${record.date}</td>
            <td>${record.studentName}</td>
            <td>${record.rollNumber}</td>
            <td>${record.collegeId}</td>
            <td>${record.class}</td>
            <td>${record.time}</td>
            <td>
                <button class="btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="deleteAttendanceRecord('${record.id}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Delete attendance record
function deleteAttendanceRecord(recordId) {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
        return;
    }

    let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    attendance = attendance.filter(a => a.id !== recordId);
    localStorage.setItem('attendance', JSON.stringify(attendance));

    showToast('Record deleted successfully', 'success');
    loadAttendanceRecords();
    updateAdminStats();
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Filter change listeners
    const classFilter = document.getElementById('classFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    const studentSearch = document.getElementById('studentSearch');

    if (classFilter) classFilter.addEventListener('change', loadAttendanceRecords);
    if (dateFromFilter) dateFromFilter.addEventListener('change', loadAttendanceRecords);
    if (dateToFilter) dateToFilter.addEventListener('change', loadAttendanceRecords);
    if (studentSearch) studentSearch.addEventListener('input', loadAttendanceRecords);
});

// Export functions
window.initAdminDashboard = initAdminDashboard;
window.updateAdminStats = updateAdminStats;
window.loadAttendanceRecords = loadAttendanceRecords;
window.deleteAttendanceRecord = deleteAttendanceRecord;
