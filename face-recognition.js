// =================================
// Face Recognition Module
// Using face-api.js for face detection and recognition
// =================================

let modelsLoaded = false;
let faceDetectionOptions = null;

// IndexedDB setup for storing face descriptors
const DB_NAME = 'FaceRecognitionDB';
const DB_VERSION = 1;
const STORE_NAME = 'faceDescriptors';

let db = null;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'studentId' });
            }
        };
    });
}

// Save face descriptor to IndexedDB
async function saveFaceDescriptor(studentId, descriptor) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const data = {
            studentId: studentId,
            descriptor: Array.from(descriptor) // Convert Float32Array to regular array
        };

        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Get face descriptor from IndexedDB
async function getFaceDescriptor(studentId) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(studentId);

        request.onsuccess = () => {
            if (request.result) {
                resolve(new Float32Array(request.result.descriptor));
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// Get all face descriptors
async function getAllFaceDescriptors() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const results = request.result.map(item => ({
                studentId: item.studentId,
                descriptor: new Float32Array(item.descriptor)
            }));
            resolve(results);
        };
        request.onerror = () => reject(request.error);
    });
}

// Delete face descriptor from IndexedDB
async function deleteFaceDescriptor(studentId) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(studentId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Load face-api.js models
async function loadFaceModels() {
    if (modelsLoaded) return true;

    try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        faceDetectionOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
        });

        modelsLoaded = true;
        await initDB();
        console.log('Face-api.js models loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading face models:', error);
        showToast('Error loading face recognition models', 'error');
        return false;
    }
}

// Detect face and extract descriptor from image element
async function detectFaceAndGetDescriptor(imageElement) {
    if (!modelsLoaded) {
        await loadFaceModels();
    }

    try {
        const detection = await faceapi
            .detectSingleFace(imageElement, faceDetectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            return detection.descriptor;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error detecting face:', error);
        return null;
    }
}

// Detect face from video stream
async function detectFaceFromVideo(videoElement) {
    if (!modelsLoaded) {
        await loadFaceModels();
    }

    try {
        const detection = await faceapi
            .detectSingleFace(videoElement, faceDetectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

        return detection;
    } catch (error) {
        console.error('Error detecting face from video:', error);
        return null;
    }
}

// Compare face descriptors and find best match
async function findMatchingStudent(faceDescriptor, threshold = 0.6) {
    if (!faceDescriptor) return null;

    try {
        const allDescriptors = await getAllFaceDescriptors();
        const students = JSON.parse(localStorage.getItem('students')) || [];

        let bestMatch = null;
        let lowestDistance = threshold;

        for (const item of allDescriptors) {
            const distance = faceapi.euclideanDistance(faceDescriptor, item.descriptor);

            if (distance < lowestDistance) {
                lowestDistance = distance;
                const student = students.find(s => s.id === item.studentId);
                if (student) {
                    bestMatch = {
                        student: student,
                        distance: distance,
                        confidence: (1 - distance) * 100
                    };
                }
            }
        }

        return bestMatch;
    } catch (error) {
        console.error('Error finding match:', error);
        return null;
    }
}

// Camera management
let currentStream = null;
let currentFacingMode = 'user'; // 'user' for front camera, 'environment' for back camera

async function startCamera(videoElement, facingMode = 'user') {
    try {
        // Stop existing stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = currentStream;
        currentFacingMode = facingMode;

        return true;
    } catch (error) {
        console.error('Error accessing camera:', error);
        showToast('Could not access camera. Please check permissions.', 'error');
        return false;
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

function switchCamera(videoElement) {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    return startCamera(videoElement, newFacingMode);
}

// Capture image from video
function captureImageFromVideo(videoElement, canvasElement) {
    const context = canvasElement.getContext('2d');
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0);

    return canvasElement.toDataURL('image/jpeg');
}

// Export functions
window.faceRecognition = {
    loadFaceModels,
    detectFaceAndGetDescriptor,
    detectFaceFromVideo,
    findMatchingStudent,
    saveFaceDescriptor,
    getFaceDescriptor,
    getAllFaceDescriptors,
    deleteFaceDescriptor,
    startCamera,
    stopCamera,
    switchCamera,
    captureImageFromVideo
};
