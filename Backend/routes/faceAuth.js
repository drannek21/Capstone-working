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

// Route to authenticate user with face
router.post('/', async (req, res) => {
    console.log('Face authentication request received');
    try {
        const { descriptor } = req.body;
        if (!descriptor) {
            return res.status(400).json({ success: false, error: 'No face descriptor provided' });
        }

        console.log('Getting users with profile pictures...');
        // Get all users with their profile pictures
        const users = await queryDatabase(`
            SELECT id, email, name, code_id, status, created_at, profilePic 
            FROM users 
            WHERE profilePic IS NOT NULL
        `);
        
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, error: 'No users found with profile pictures' });
        }

        console.log(`Found ${users.length} users with profile pictures`);
        let bestMatch = null;
        let bestDistance = Infinity;

        // Process each user's profile picture
        for (const user of users) {
            try {
                console.log(`Processing user ${user.id}`);
                // Get the image URL from Cloudinary
                const imageUrl = user.profilePic;
                
                if (!imageUrl) {
                    console.log(`No profile picture URL for user ${user.id}`);
                    continue;
                }

                // Download the image from Cloudinary
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    console.log(`Failed to fetch image for user ${user.id}`);
                    continue;
                }

                const arrayBuffer = await response.arrayBuffer();
                const imageBuffer = Buffer.from(arrayBuffer);

                // Create a new Image instance
                const image = new Image();
                image.src = imageBuffer;

                // Detect face in the profile picture
                const detections = await faceapi.detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detections) {
                    console.log(`Face detected for user ${user.id}`);
                    const distance = faceapi.euclideanDistance(descriptor, detections.descriptor);
                    console.log(`Distance: ${distance}`);
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestMatch = user;
                    }
                } else {
                    console.log(`No face detected for user ${user.id}`);
                }
            } catch (error) {
                console.error(`Error processing user ${user.id}:`, error);
                continue;
            }
        }

        // Check if we found a match
        if (bestMatch && bestDistance < 0.6) { // Threshold for face matching
            console.log(`Match found! User ID: ${bestMatch.id}, Distance: ${bestDistance}`);
            // Remove sensitive information
            delete bestMatch.profilePic;
            return res.json({ 
                success: true, 
                user: {
                    id: bestMatch.id,
                    email: bestMatch.email,
                    name: bestMatch.name,
                    code_id: bestMatch.code_id,
                    status: bestMatch.status,
                    created_at: bestMatch.created_at
                },
                message: 'Face authentication successful'
            });
        } else {
            console.log('No match found or distance too high');
            return res.status(401).json({ 
                success: false, 
                error: 'No matching face found' 
            });
        }
    } catch (error) {
        console.error('Face authentication error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error during face authentication' 
        });
    }
});

module.exports = router; 