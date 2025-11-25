// =================================
// Attendance Scanning Module
// =================================

let scanCameraActive = false;
let scanningActive = false;
let scanInterval = null;

// Initialize scan view
function initScanView() {
    if (!scanCameraActive) {
        startScanCamera();
    }
    loadTodayScannedAttendance();
}

// Start camera for scanning
async function startScanCamera() {
    const video = document.getElementById('scanVideo');
    const success = await window.faceRecognition.startCamera(video);

    if (success) {
        scanCameraActive = true;

        // Load face models if not already loaded
        await window.faceRecognition.loadFaceModels();
    }
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    const startScanBtn = document.getElementById('startScanBtn');
    const stopScanBtn = document.getElementById('stopScanBtn');
    const switchScanCameraBtn = document.getElementById('switchScanCameraBtn');

    startScanBtn.addEventListener('click', startScanning);
    stopScanBtn.addEventListener('click', stopScanning);
    switchScanCameraBtn.addEventListener('click', switchScanCamera);
});

// Start continuous scanning
async function startScanning() {
    if (scanningActive) return;

    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    const statusText = document.getElementById('scanStatus');

    scanningActive = true;
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-flex';
    statusText.textContent = 'Scanning for faces...';

    // Scan every 2 seconds
    scanInterval = setInterval(async () => {
        await scanForFace();
    }, 2000);
}

// Stop scanning
function stopScanning() {
    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    const statusText = document.getElementById('scanStatus');

    scanningActive = false;
    clearInterval(scanInterval);

    startBtn.style.display = 'inline-flex';
    stopBtn.style.display = 'none';
    statusText.textContent = 'Position face in the frame';
}

// Scan for face and mark attendance
async function scanForFace() {
    const video = document.getElementById('scanVideo');
    const statusText = document.getElementById('scanStatus');

    try {
        // Detect face from video
        const detection = await window.faceRecognition.detectFaceFromVideo(video);

        if (!detection) {
            statusText.textContent = 'No face detected. Please position face in frame...';
            return;
        }

        statusText.textContent = 'Face detected! Identifying...';

        // Find matching student
        const match = await window.faceRecognition.findMatchingStudent(detection.descriptor, 0.6);

        if (match && match.confidence > 40) {
            const student = match.student;
            statusText.textContent = `Identified: ${student.name} (${match.confidence.toFixed(1)}% confidence)`;

            // Check if already marked today
            const today = formatDate(new Date());
            const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
            const alreadyMarked = attendance.some(
                a => a.studentId === student.id && a.date === today
            );

            if (alreadyMarked) {
                showToast(`${student.name} already marked present today`, 'error');
                statusText.textContent = 'Already marked present today';
                return;
            }

            // Mark attendance
            const attendanceRecord = {
                id: generateId(),
                studentId: student.id,
                studentName: student.name,
                rollNumber: student.rollNumber,
                collegeId: student.collegeId,
                class: student.class,
                date: today,
                time: formatTime(new Date()),
                timestamp: Date.now()
            };

            attendance.push(attendanceRecord);
            localStorage.setItem('attendance', JSON.stringify(attendance));

            showToast(`✅ Attendance marked for ${student.name}`, 'success');
            statusText.textContent = `✅ Attendance marked successfully!`;

            // Update today's scan list
            loadTodayScannedAttendance();

            // Update admin stats if available
            if (window.updateAdminStats) {
                window.updateAdminStats();
            }

            // Brief pause before continuing
            setTimeout(() => {
                if (scanningActive) {
                    statusText.textContent = 'Scanning for faces...';
                }
            }, 2000);
        } else {
            statusText.textContent = 'Face not recognized. Please register first.';
        }
    } catch (error) {
        console.error('Error scanning face:', error);
        statusText.textContent = 'Error scanning. Please try again.';
    }
}

// Switch camera
async function switchScanCamera() {
    const video = document.getElementById('scanVideo');
    const btn = document.getElementById('switchScanCameraBtn');

    btn.disabled = true;
    btn.textContent = 'Switching...';

    await window.faceRecognition.switchCamera(video);

    btn.disabled = false;
    btn.textContent = 'Switch Camera';
}

// Load today's scanned attendance
function loadTodayScannedAttendance() {
    const today = formatDate(new Date());
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];

    const todayAttendance = attendance.filter(a => a.date === today)
        .sort((a, b) => b.timestamp - a.timestamp);

    const listContainer = document.getElementById('scanResultsList');

    if (todayAttendance.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No attendance recorded today</p>';
        return;
    }

    listContainer.innerHTML = todayAttendance.map(record => `
        <div class="scan-item">
            <div>
                <strong>${record.studentName}</strong>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">
                    ${record.rollNumber} • ${record.class}
                </p>
            </div>
            <div style="text-align: right;">
                <strong>${record.time}</strong>
            </div>
        </div>
    `).join('');
}

// Cleanup when leaving view
function cleanupScanView() {
    stopScanning();
    if (scanCameraActive) {
        window.faceRecognition.stopCamera();
        scanCameraActive = false;
    }
}

// Export functions
window.initScanView = initScanView;
window.cleanupScanView = cleanupScanView;
