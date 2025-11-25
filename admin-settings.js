// =================================
// Admin Settings Module
// =================================

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', updateAdminSettings);
    }
});

// Update admin settings
function updateAdminSettings(e) {
    e.preventDefault();

    const newUsername = document.getElementById('newUsername').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Get current credentials
    const adminCredentials = JSON.parse(localStorage.getItem('adminCredentials'));

    // Verify current password
    if (currentPassword !== adminCredentials.password) {
        showToast('Current password is incorrect', 'error');
        return;
    }

    // Validate new password if provided
    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters', 'error');
            return;
        }
    }

    // Update credentials
    const updatedCredentials = {
        username: newUsername || adminCredentials.username,
        password: newPassword || adminCredentials.password
    };

    localStorage.setItem('adminCredentials', JSON.stringify(updatedCredentials));

    // Reset form
    document.getElementById('settingsForm').reset();

    showToast('Settings updated successfully', 'success');

    // If username changed, update session
    if (newUsername && newUsername !== adminCredentials.username) {
        const session = JSON.parse(localStorage.getItem('currentSession'));
        if (session) {
            session.username = newUsername;
            localStorage.setItem('currentSession', JSON.stringify(session));
        }
    }
}

// Export functions
window.updateAdminSettings = updateAdminSettings;
