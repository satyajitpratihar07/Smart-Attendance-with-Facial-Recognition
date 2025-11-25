// =================================
// Manage Students Module
// =================================

// Load all students
function loadManageStudents(searchQuery = '') {
    const students = JSON.parse(localStorage.getItem('students')) || [];

    // Filter students based on search
    let filteredStudents = students;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredStudents = students.filter(student => {
            return student.name.toLowerCase().includes(query) ||
                student.collegeId.toLowerCase().includes(query) ||
                student.rollNumber.toLowerCase().includes(query);
        });
    }

    // Sort by name
    filteredStudents.sort((a, b) => a.name.localeCompare(b.name));

    // Display students
    const tbody = document.getElementById('studentsTableBody');

    if (filteredStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No students found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredStudents.map(student => {
        const regDate = new Date(student.registrationDate);
        const dateStr = regDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <tr>
                <td>
                    <img src="${student.photoUrl}" 
                         alt="${student.name}" 
                         style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                </td>
                <td><strong>${student.name}</strong></td>
                <td>${student.collegeId}</td>
                <td>${student.rollNumber}</td>
                <td>${student.class}</td>
                <td>${dateStr}</td>
                <td>
                    <button class="btn-danger" 
                            style="padding: 0.25rem 0.75rem; font-size: 0.875rem;" 
                            onclick="deleteStudent('${student.id}', '${student.name}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Delete student
async function deleteStudent(studentId, studentName) {
    if (!confirm(`Are you sure you want to delete ${studentName}? This will also remove all their attendance records and cannot be undone.`)) {
        return;
    }

    try {
        // Remove student from students array
        let students = JSON.parse(localStorage.getItem('students')) || [];
        students = students.filter(s => s.id !== studentId);
        localStorage.setItem('students', JSON.stringify(students));

        // Remove attendance records
        let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
        attendance = attendance.filter(a => a.studentId !== studentId);
        localStorage.setItem('attendance', JSON.stringify(attendance));

        // Remove face descriptor from IndexedDB
        await window.faceRecognition.deleteFaceDescriptor(studentId);

        showToast(`${studentName} has been deleted successfully`, 'success');

        // Reload the list
        const searchQuery = document.getElementById('manageStudentSearch').value;
        loadManageStudents(searchQuery);

        // Update admin stats if function exists
        if (window.updateAdminStats) {
            window.updateAdminStats();
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        showToast('Error deleting student. Please try again.', 'error');
    }
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('manageStudentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            loadManageStudents(e.target.value);
        });
    }
});

// Export functions
window.loadManageStudents = loadManageStudents;
window.deleteStudent = deleteStudent;
