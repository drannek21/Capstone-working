const express = require('express');
const router = express.Router();
const { pool, queryDatabase } = require('../database');
const faceapi = require('face-api.js');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');
const canvas = require('canvas');
const { Canvas, Image } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image });

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get the absolute path to the models directory
const modelsPath = path.join(__dirname, '..', 'models');

// Load face-api.js models
async function loadModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
        console.log('Face detection models loaded successfully');
    } catch (error) {
        console.error('Error loading face detection models:', error);
        throw error;
    }
}

// Initialize models when the route is loaded
loadModels().catch(console.error);

// Helper function to calculate face distance
const calculateFaceDistance = (descriptor1, descriptor2) => {
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
        sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    return Math.sqrt(sum);
};

// Function to compare two descriptors and return a similarity score (0-100%)
const calculateSimilarityPercentage = (descriptor1, descriptor2) => {
    const distance = calculateFaceDistance(descriptor1, descriptor2);
    // Convert distance to percentage (1.0 distance → 0% similarity, 0.0 distance → 100% similarity)
    // Typically distances below 0.6 are considered good matches
    const normalizedDistance = Math.min(distance, 1.0); // Cap at 1.0
    const similarityPercentage = (1 - normalizedDistance) * 100;
    return similarityPercentage.toFixed(2);
};

// Route to check if user exists and is verified
router.post('/check-user-status', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email is required' 
            });
        }
        
        // Get user by email
        const users = await queryDatabase(
            'SELECT id, email, name, code_id, status, faceRecognitionPhoto FROM users WHERE email = ?', 
            [email]
        );
        
        if (!users || users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found with this email' 
            });
        }
        
        const user = users[0];
        
        // Return user status and whether they have face recognition
        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                status: user.status,
                hasFaceRecognition: user.faceRecognitionPhoto ? true : false
            }
        });
    } catch (error) {
        console.error('Error checking user status:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error while checking user status' 
        });
    }
});

// Route to authenticate user with face
router.post('/', async (req, res) => {
    console.log('\n===== NEW FACE AUTHENTICATION REQUEST =====');
    try {
        const { descriptor, email } = req.body;
        
        // Validate required inputs
        if (!descriptor) {
            console.log('No face descriptor provided in request');
            return res.status(400).json({ success: false, error: 'No face descriptor provided' });
        }
        
        if (!email) {
            console.log('No email provided in request payload');
            return res.status(400).json({ 
                success: false, 
                error: 'Email is required for face authentication' 
            });
        }
        
        console.log(`Received descriptor with ${descriptor.length} values`);
        console.log(`Email provided in request: "${email}"`);

        console.log('Checking if email exists and has a registered face photo...');
        // Get ONLY the user with the provided email
        const users = await queryDatabase(`
            SELECT id, email, name, code_id, status, created_at, faceRecognitionPhoto
            FROM users 
            WHERE email = ? AND faceRecognitionPhoto IS NOT NULL
        `, [email]);
        
        console.log(`Database query for user with email "${email}" returned ${users ? users.length : 0} results`);
        
        if (!users || users.length === 0) {
            console.log(`No user found with email ${email} or no face photo registered`);
            return res.status(404).json({ 
                success: false, 
                error: 'No user found with this email or no face photo registered. Please register a face photo first.' 
            });
        }

        // Get the single user that matches the email
        const user = users[0];
        console.log(`Found user with ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
        
        // Get the image URL from Cloudinary
        const imageUrl = user.faceRecognitionPhoto;
        
        if (!imageUrl) {
            console.log(`No face recognition photo URL for user ${user.id}`);
            return res.status(400).json({ 
                success: false, 
                error: 'No face photo registered for this user' 
            });
        }
        
        console.log(`Face photo URL: ${imageUrl}`);

        // Download the image from Cloudinary
        console.log(`Downloading image for user ${user.id}...`);
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            console.log(`Failed to fetch image for user ${user.id}: ${response.status}`);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to retrieve face data. Please try again.' 
            });
        }

        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        console.log(`Image downloaded successfully, size: ${imageBuffer.length} bytes`);

        // Create a new Image instance
        const image = new Image();
        image.src = imageBuffer;
        console.log(`Image loaded, dimensions: ${image.width}x${image.height}`);

        // Detect face using TinyFaceDetector
        console.log(`Detecting face for user ${user.id}...`);
        const detectorOptions = new faceapi.TinyFaceDetectorOptions({ 
            inputSize: 416,
            scoreThreshold: 0.5
        });
        
        // Detect face with landmarks and descriptor
        const detections = await faceapi.detectSingleFace(image, detectorOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detections) {
            console.log(`No face detected in the registered photo for user ${user.id}`);
            return res.status(400).json({ 
                success: false, 
                error: 'No face detected in your registered photo. Please contact support or update your face photo.' 
            });
        }
        
        console.log(`Face detected for user ${user.id}`);
        console.log(`Face descriptor length: ${detections.descriptor.length}`);
        
        // Calculate distance and similarity percentage
        const distance = faceapi.euclideanDistance(descriptor, detections.descriptor);
        const similarity = calculateSimilarityPercentage(descriptor, detections.descriptor);
        
        console.log(`User ${user.id} - distance: ${distance.toFixed(4)}, similarity: ${similarity}%`);
        
        // Use a threshold of 65% to make face recognition less sensitive to lighting
        if (parseFloat(similarity) > 65) {
            // Remove sensitive information before sending response
            delete user.faceRecognitionPhoto;
            
            console.log(`Returning successful authentication for user ${user.id}`);
            return res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    code_id: user.code_id,
                    status: user.status,
                    created_at: user.created_at
                },
                message: 'Face authentication successful'
            });
        } else {
            console.log(`Similarity (${similarity}%) is below required threshold of 65%`);
            return res.status(401).json({ 
                success: false, 
                error: 'Face not recognized. Try adjusting lighting or position your face more clearly in the camera.'
            });
        }
    } catch (error) {
        console.error('Face authentication error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error during face authentication. Please try again.' 
        });
    }
});

module.exports = router;