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
        
        // STEP 1: Validate input parameters
        console.log("STEP 1: Validating input parameters");
        console.log("Email from request body:", email);
        console.log("Request body keys:", Object.keys(req.body));
        
        if (!descriptor) {
            console.log("ERROR: No face descriptor provided");
            return res.status(400).json({ success: false, error: 'No face descriptor provided' });
        }
        
        if (!email) {
            console.log("ERROR: No email provided");
            return res.status(400).json({ success: false, error: 'Email is required for face authentication' });
        }
        
        console.log(`Input validation passed. Email: ${email}, Descriptor length: ${descriptor.length}`);

        // STEP 2: Find user with the provided email
        console.log(`STEP 2: Finding user with email: ${email}`);
        const users = await queryDatabase(
            'SELECT id, email, name, code_id, status, created_at, faceRecognitionPhoto FROM users WHERE email = ?',
            [email]
        );

        if (!users || users.length === 0) {
            console.log(`ERROR: No user found with email: ${email}`);
            return res.status(404).json({ 
                success: false, 
                error: 'User not found with this email' 
            });
        }

        const user = users[0];
        console.log(`SUCCESS: Found user. ID: ${user.id}, Name: ${user.name}`);

        // STEP 3: Check if user has a registered face photo
        console.log("STEP 3: Checking if user has registered face photo");
        if (!user.faceRecognitionPhoto) {
            console.log(`ERROR: User ${user.id} has no face recognition photo registered`);
            return res.status(400).json({ 
                success: false, 
                error: 'You have not registered a face photo. Please register your face first.' 
            });
        }
        console.log(`SUCCESS: User has registered face photo`);

        // STEP 4: Download and process the user's face photo
        console.log("STEP 4: Processing user's face photo");
        const imageUrl = user.faceRecognitionPhoto;
        console.log(`Face photo URL: ${imageUrl}`);

        try {
            // Download the image
            console.log(`Downloading image for user ${user.id}...`);
            const response = await fetch(imageUrl);
            if (!response.ok) {
                console.log(`ERROR: Failed to fetch image: ${response.status}`);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to retrieve your registered face photo' 
                });
            }

            const arrayBuffer = await response.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            console.log(`SUCCESS: Image downloaded, size: ${imageBuffer.length} bytes`);

            // Create a new Image instance
            const image = new Image();
            image.src = imageBuffer;
            console.log(`Image loaded, dimensions: ${image.width}x${image.height}`);

            // STEP 5: Detect face in the stored photo
            console.log("STEP 5: Detecting face in stored photo");
            const detectorOptions = new faceapi.TinyFaceDetectorOptions({ 
                inputSize: 416,
                scoreThreshold: 0.5
            });
            
            const storedFace = await faceapi.detectSingleFace(image, detectorOptions)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!storedFace) {
                console.log(`ERROR: No face detected in the stored photo for user ${user.id}`);
                return res.status(400).json({ 
                    success: false, 
                    error: 'Your registered face photo is invalid. Please register your face again.' 
                });
            }
            console.log(`SUCCESS: Face detected in stored photo`);

            // STEP 6: Compare the live face with the stored face
            console.log("STEP 6: Comparing live face with stored face");
            const distance = faceapi.euclideanDistance(descriptor, storedFace.descriptor);
            const similarity = calculateSimilarityPercentage(descriptor, storedFace.descriptor);
            
            console.log(`Face comparison results: distance = ${distance.toFixed(4)}, similarity = ${similarity}%`);

            // STEP 7: Make authentication decision
            console.log("STEP 7: Making authentication decision");
            if (parseFloat(similarity) > 65) {
                console.log(`SUCCESS: Face authenticated with ${similarity}% similarity`);
                
                // Remove sensitive data before sending response
                delete user.faceRecognitionPhoto;
                
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
                console.log(`ERROR: Similarity (${similarity}%) below threshold of 65%`);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Face not recognized. The face does not match our records for this email.' 
                });
            }
        } catch (imageError) {
            console.error('Error processing face image:', imageError);
            return res.status(500).json({ 
                success: false, 
                error: 'Error processing your face photo. Please try again.' 
            });
        }
    } catch (error) {
        console.error('Face authentication error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error during face authentication. Please try again.' 
        });
    }
});

module.exports = router;