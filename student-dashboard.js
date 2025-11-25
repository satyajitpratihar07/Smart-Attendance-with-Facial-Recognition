// =================================
// Student Dashboard Module
// =================================

// Initialize student dashboard
function initStudentDashboard() {
    const session = JSON.parse(localStorage.getItem('currentSession'));
    if (!session || session.userType !== 'student') {
        return;
    }

    const students = JSON.parse(localStorage.getItem('students')) || [];
    const student = students.find(s => s.id === session.studentId);

    if (!student) {
        showToast('Student data not found', 'error');
        return;
    }

    // Display student info
    document.getElementById('studentDisplayName').textContent = student.name;
    document.getElementById('studentDisplayId').textContent = student.collegeId;
    document.getElementById('studentDisplayRoll').textContent = student.rollNumber;
    document.getElementById('studentDisplayClass').textContent = student.class;

    // Load attendance data
    loadStudentAttendance(student.id);
}

// Load student attendance
function loadStudentAttendance(studentId, dateFrom = null, dateTo = null) {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];

    // Filter attendance for this student
    let studentAttendance = attendance.filter(a => a.studentId === studentId);

    // Apply date filters if provided
    if (dateFrom) {
        studentAttendance = studentAttendance.filter(a => a.date >= dateFrom);
    }
    if (dateTo) {
        studentAttendance = studentAttendance.filter(a => a.date <= dateTo);
    }

    // Sort by date (newest first)
    studentAttendance.sort((a, b) => b.timestamp - a.timestamp);

    // Calculate statistics
    const totalDays = studentAttendance.length;

    // Calculate percentage (simplified - based on total records)
    // In a real system, you'd calculate this based on total class days
    const percentage = totalDays > 0 ? 100 : 0; // Simplified calculation

    // Update stats
    document.getElementById('studentAttendancePercentage').textContent = percentage + '%';
    document.getElementById('studentTotalDays').textContent = totalDays;

    // Display attendance history
    displayAttendanceHistory(studentAttendance);
}

// Display attendance history
function displayAttendanceHistory(attendanceRecords) {
    const listContainer = document.getElementById('studentAttendanceList');

    if (attendanceRecords.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No attendance records found</p>';
        return;
    }

    listContainer.innerHTML = attendanceRecords.map(record => `
        <div class="attendance-item">
            <div>
                <strong>${record.date}</strong>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">
                    ${record.class}
                </p>
            </div>
            <div style="text-align: right;">
                <strong>${record.time}</strong>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">✅ Present</p>
            </div>
        </div>
    `).join('');
}

// Filter student history
function filterStudentHistory() {
    const dateFrom = document.getElementById('studentDateFrom').value;
    const dateTo = document.getElementById('studentDateTo').value;

    const session = JSON.parse(localStorage.getItem('currentSession'));
    if (session && session.studentId) {
        loadStudentAttendance(session.studentId, dateFrom, dateTo);
    }
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    const filterBtn = document.getElementById('filterStudentHistory');
    if (filterBtn) {
        filterBtn.addEventListener('click', filterStudentHistory);
    }
});

// Export functions
window.initStudentDashboard = initStudentDashboard;
window.filterStudentHistory = filterStudentHistory;
