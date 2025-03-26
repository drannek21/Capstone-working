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
        if (!descriptor) {
            return res.status(400).json({ success: false, error: 'No face descriptor provided' });
        }
        console.log(`Received descriptor with ${descriptor.length} values`);
        if (email) {
            console.log(`Email provided: ${email}`);
        }

        console.log('Getting users with face recognition photos...');
        // Get users with their face recognition photos, filtered by email if provided
        let query = `
            SELECT id, email, name, code_id, status, created_at, faceRecognitionPhoto
            FROM users 
            WHERE faceRecognitionPhoto IS NOT NULL
        `;
        
        const queryParams = [];
        if (email) {
            query += ` AND email = ?`;
            queryParams.push(email);
        }
        
        const users = await queryDatabase(query, queryParams);
        
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, error: 'No users found with face recognition photos. Please register a face photo first.' });
        }

        console.log(`Found ${users.length} users with face recognition photos:`);
        users.forEach(user => {
            console.log(`User ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
        });
        
        // Track all matches with their similarity score and percentage
        let allMatches = [];

        // Process each user's face recognition photo
        for (const user of users) {
            try {
                console.log(`\n----- Processing user ${user.id} (${user.name}) -----`);
                // Get the image URL from Cloudinary
                const imageUrl = user.faceRecognitionPhoto;
                
                if (!imageUrl) {
                    console.log(`No face recognition photo URL for user ${user.id}`);
                    continue;
                }
                console.log(`Face photo URL: ${imageUrl}`);

                // Download the image from Cloudinary
                try {
                    console.log(`Downloading image for user ${user.id}...`);
                    const response = await fetch(imageUrl);
                    if (!response.ok) {
                        console.log(`Failed to fetch image for user ${user.id}: ${response.status}`);
                        continue;
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    const imageBuffer = Buffer.from(arrayBuffer);
                    console.log(`Image downloaded successfully, size: ${imageBuffer.length} bytes`);

                    // Create a new Image instance
                    const image = new Image();
                    image.src = imageBuffer;
                    console.log(`Image loaded, dimensions: ${image.width}x${image.height}`);

                    // Detect face using TinyFaceDetector with higher minConfidence
                    console.log(`Detecting face for user ${user.id}...`);
                    // Create detector options with higher min confidence and smaller input size for better accuracy
                    const detectorOptions = new faceapi.TinyFaceDetectorOptions({ 
                        inputSize: 416,       // Higher input size for better detection
                        scoreThreshold: 0.5   // Lower threshold to be more forgiving with different lighting conditions
                    });
                    
                    // Detect face with landmarks and descriptor
                    const detections = await faceapi.detectSingleFace(image, detectorOptions)
                        .withFaceLandmarks()
                        .withFaceDescriptor();

                    if (detections) {
                        console.log(`Face detected for user ${user.id}`);
                        console.log(`Face descriptor length: ${detections.descriptor.length}`);
                        
                        // Calculate distance and similarity percentage
                        const distance = faceapi.euclideanDistance(descriptor, detections.descriptor);
                        const similarity = calculateSimilarityPercentage(descriptor, detections.descriptor);
                        
                        console.log(`User ${user.id} - distance: ${distance.toFixed(4)}, similarity: ${similarity}%`);
                        
                        // Add to matches regardless of distance value
                        allMatches.push({
                            user,
                            distance,
                            similarity
                        });
                        console.log(`Added user ${user.id} to matches with similarity ${similarity}%`);
                    } else {
                        console.log(`No face detected for user ${user.id}. The photo may be invalid or doesn't contain a clear face.`);
                    }
                } catch (fetchError) {
                    console.error(`Error fetching or processing image for user ${user.id}:`, fetchError);
                    continue;
                }
            } catch (error) {
                console.error(`Error processing user ${user.id}:`, error);
                continue;
            }
        }

        console.log(`\n----- Processing results -----`);
        console.log(`Total matches found: ${allMatches.length}`);
        
        // Sort all matches by similarity (lower distance = more similar)
        allMatches.sort((a, b) => a.distance - b.distance);
        
        // Log all matches for debugging
        console.log(`\nAll matches sorted by similarity:`);
        allMatches.forEach((match, index) => {
            console.log(`Match #${index + 1}: User ID: ${match.user.id}, Name: ${match.user.name}, Similarity: ${match.similarity}%, Distance: ${match.distance.toFixed(4)}`);
        });
        
        // Make sure matches are sufficiently different from each other to diagnose the issue
        if (allMatches.length > 1) {
            const bestMatch = allMatches[0];
            const secondBestMatch = allMatches[1];
            const similarityDifference = bestMatch.similarity - secondBestMatch.similarity;
            console.log(`\nDifference between best match (${bestMatch.user.name}) and second best (${secondBestMatch.user.name}): ${similarityDifference.toFixed(2)}%`);
        }
        
        // Always take the best visual match if any matches exist
        if (allMatches.length > 0) {
            const bestMatch = allMatches[0].user;
            const bestDistance = allMatches[0].distance;
            const bestSimilarity = allMatches[0].similarity;
            
            console.log(`\nBest visual match found!`);
            console.log(`User ID: ${bestMatch.id}`);
            console.log(`Name: ${bestMatch.name}`);
            console.log(`Email: ${bestMatch.email}`);
            console.log(`Similarity: ${bestSimilarity}%`);
            
            // Use a much lower threshold (65%) to make face recognition less sensitive to lighting
            if (parseFloat(bestSimilarity) > 65) {
                // Remove sensitive information
                delete bestMatch.faceRecognitionPhoto;
                
                console.log(`Returning successful authentication for user ${bestMatch.id}`);
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
                console.log(`Best match similarity (${bestSimilarity}%) is below required threshold of 65%`);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Face not recognized. Try adjusting lighting or position your face more clearly in the camera.'
                });
            }
        } else {
            console.log('No faces detected in any registered photos');
            return res.status(401).json({ 
                success: false, 
                error: 'No matching face found. Please ensure your face is clearly visible and well-lit.' 
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