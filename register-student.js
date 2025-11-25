// =================================
// Student Registration Module
// =================================

let registerCameraActive = false;
let capturedFaceData = null;

// Initialize register view
function initRegisterView() {
    if (!registerCameraActive) {
        startRegisterCamera();
    }
}

// Start camera for registration
async function startRegisterCamera() {
    const video = document.getElementById('registerVideo');
    const success = await window.faceRecognition.startCamera(video);

    if (success) {
        registerCameraActive = true;
        video.style.display = 'block';

        // Load face models if not already loaded
        await window.faceRecognition.loadFaceModels();
    }
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    const captureBtn = document.getElementById('captureBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const switchCameraBtn = document.getElementById('switchCameraBtn');
    const registerForm = document.getElementById('registerForm');

    captureBtn.addEventListener('click', captureFace);
    retakeBtn.addEventListener('click', retakeFace);
    switchCameraBtn.addEventListener('click', switchRegisterCamera);
    registerForm.addEventListener('submit', registerStudent);
});

// Capture face from video
async function captureFace() {
    const video = document.getElementById('registerVideo');
    const canvas = document.getElementById('registerCanvas');
    const preview = document.getElementById('registerPreview');
    const capturedImage = document.getElementById('capturedImage');
    const captureBtn = document.getElementById('captureBtn');
    const retakeBtn = document.getElementById('retakeBtn');

    if (!registerCameraActive) {
        showToast('Please wait for camera to start', 'error');
        return;
    }

    // Show loading state
    captureBtn.disabled = true;
    captureBtn.textContent = 'Detecting face...';

    try {
        // Detect face in current video frame
        const detection = await window.faceRecognition.detectFaceFromVideo(video);

        if (!detection) {
            showToast('No face detected. Please position your face in the frame.', 'error');
            captureBtn.disabled = false;
            captureBtn.textContent = 'Capture Face';
            return;
        }

        // Capture image
        const imageData = window.faceRecognition.captureImageFromVideo(video, canvas);

        // Store face descriptor
        capturedFaceData = {
            descriptor: detection.descriptor,
            imageData: imageData
        };

        // Show preview
        capturedImage.src = imageData;
        video.style.display = 'none';
        preview.style.display = 'block';
        captureBtn.style.display = 'none';
        retakeBtn.style.display = 'inline-flex';

        showToast('Face captured successfully!', 'success');
    } catch (error) {
        console.error('Error capturing face:', error);
        showToast('Error capturing face. Please try again.', 'error');
    } finally {
        captureBtn.disabled = false;
        captureBtn.textContent = 'Capture Face';
    }
}

// Retake face capture
function retakeFace() {
    const video = document.getElementById('registerVideo');
    const preview = document.getElementById('registerPreview');
    const captureBtn = document.getElementById('captureBtn');
    const retakeBtn = document.getElementById('retakeBtn');

    capturedFaceData = null;
    video.style.display = 'block';
    preview.style.display = 'none';
    captureBtn.style.display = 'inline-flex';
    retakeBtn.style.display = 'none';
}

// Switch camera
async function switchRegisterCamera() {
    const video = document.getElementById('registerVideo');
    const btn = document.getElementById('switchCameraBtn');

    btn.disabled = true;
    btn.textContent = 'Switching...';

    await window.faceRecognition.switchCamera(video);

    btn.disabled = false;
    btn.textContent = 'Switch Camera';
}

// Register student
async function registerStudent(e) {
    e.preventDefault();

    if (!capturedFaceData) {
        showToast('Please capture a face image first', 'error');
        return;
    }

    // Get form data
    const name = document.getElementById('studentName').value.trim();
    const collegeId = document.getElementById('studentCollegeID').value.trim();
    const rollNumber = document.getElementById('studentRollNumber').value.trim();
    const studentClass = document.getElementById('studentClass').value.trim();

    // Validate
    if (!name || !collegeId || !rollNumber || !studentClass) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    // Check if college ID already exists
    const students = JSON.parse(localStorage.getItem('students')) || [];
    if (students.find(s => s.collegeId === collegeId)) {
        showToast('A student with this College ID already exists', 'error');
        return;
    }

    // Create student object
    const studentId = generateId();
    const student = {
        id: studentId,
        name: name,
        collegeId: collegeId,
        rollNumber: rollNumber,
        class: studentClass,
        registrationDate: new Date().toISOString(),
        photoUrl: capturedFaceData.imageData
    };

    try {
        // Save face descriptor to IndexedDB
        await window.faceRecognition.saveFaceDescriptor(studentId, capturedFaceData.descriptor);

        // Save student data to localStorage
        students.push(student);
        localStorage.setItem('students', JSON.stringify(students));

        showToast(`Student ${name} registered successfully!`, 'success');

        // Reset form
        document.getElementById('registerForm').reset();
        retakeFace();
        capturedFaceData = null;

        // Update admin dashboard if function exists
        if (window.updateAdminStats) {
            window.updateAdminStats();
        }
    } catch (error) {
        console.error('Error registering student:', error);
        showToast('Error registering student. Please try again.', 'error');
    }
}

// Cleanup when leaving view
function cleanupRegisterView() {
    if (registerCameraActive) {
        window.faceRecognition.stopCamera();
        registerCameraActive = false;
    }
}

// Export functions
window.initRegisterView = initRegisterView;
window.cleanupRegisterView = cleanupRegisterView;
