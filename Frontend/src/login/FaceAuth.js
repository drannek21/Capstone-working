import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './FaceAuth.css';
import axios from 'axios';

const FaceAuth = ({ onLoginSuccess, email }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isRunning, setIsRunning] = useState(false);
    const [stream, setStream] = useState(null);
    const [message, setMessage] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [previousFrames, setPreviousFrames] = useState([]);
    const [staticFrameCount, setStaticFrameCount] = useState(0);
    const [lastMovementTime, setLastMovementTime] = useState(Date.now());
    // Get email from localStorage if it's not passed as a prop
    const [userEmail, setUserEmail] = useState(email || localStorage.getItem('faceAuthEmail') || '');
    
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

    useEffect(() => {
        loadModels();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        // Update userEmail state if email prop changes
        if (email) {
            setUserEmail(email);
            console.log("Email prop received in FaceAuth:", email);
            setMessage(`Welcome ${email}! Loading face detection models...`);
        } else {
            // Try to get from localStorage if not in props
            const storedEmail = localStorage.getItem('faceAuthEmail');
            if (storedEmail) {
                setUserEmail(storedEmail);
                console.log("Email found in localStorage:", storedEmail);
                setMessage(`Welcome ${storedEmail}! Loading face detection models...`);
            } else {
                console.log("No email found in prop or localStorage");
                setMessage('Loading face detection models...');
            }
        }
    }, [email]);

    const loadModels = async () => {
        try {
            setMessage('Loading face detection models...');
            
            // Load models one by one with error handling
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            console.log('Tiny Face Detector loaded');
            
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            console.log('Face Landmark 68 loaded');
            
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            console.log('Face Recognition loaded');

            setModelsLoaded(true);
            setMessage('Models loaded successfully! You can now start the camera.');
        } catch (error) {
            console.error('Error loading models:', error);
            setMessage('Error loading face detection models. Please check if the model files are present in the /models directory.');
            setModelsLoaded(false);
        }
    };

    const startCamera = async () => {
        if (!modelsLoaded) {
            setMessage('Please wait for models to load before starting the camera.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: 720,
                    height: 560,
                    facingMode: 'user'
                } 
            });
            videoRef.current.srcObject = stream;
            setStream(stream);
            setIsRunning(true);
            detectFaces();
        } catch (error) {
            console.error('Error accessing camera:', error);
            setMessage('Error accessing camera. Please make sure you have granted camera permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setStream(null);
            setIsRunning(false);
        }
    };

    const checkForStaticImage = () => {
        if (!videoRef.current) return false;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Keep last 5 frames for comparison
        const frames = [...previousFrames, currentFrame].slice(-5);
        setPreviousFrames(frames);

        if (frames.length < 2) return false;

        // Compare current frame with previous frames
        let totalDiff = 0;
        for (let i = 1; i < frames.length; i++) {
            const diff = calculateFrameDifference(frames[i], frames[i-1]);
            totalDiff += diff;
        }

        const averageDiff = totalDiff / (frames.length - 1);
        
        // More strict threshold for movement detection
        const isStatic = averageDiff < 2.0;
        
        if (isStatic) {
            setStaticFrameCount(prev => prev + 1);
            // If static for more than 15 frames (about 0.5 seconds), likely a photo
            if (staticFrameCount > 15) {
                return true;
            }
        } else {
            setStaticFrameCount(0);
            setLastMovementTime(Date.now());
        }

        // If no significant movement for 3 seconds, consider it a static image
        if (Date.now() - lastMovementTime > 3000) {
            return true;
        }

        return false;
    };

    const calculateFrameDifference = (frame1, frame2) => {
        let diff = 0;
        const data1 = frame1.data;
        const data2 = frame2.data;
        
        // Sample pixels for performance (every 4th pixel)
        for (let i = 0; i < data1.length; i += 16) {
            // Compare RGB values
            diff += Math.abs(data1[i] - data2[i]); // R
            diff += Math.abs(data1[i + 1] - data2[i + 1]); // G
            diff += Math.abs(data1[i + 2] - data2[i + 2]); // B
        }
        
        // Normalize the difference
        return diff / (data1.length / 16);
    };

    const authenticateUser = async () => {
        if (!modelsLoaded || isAuthenticating) {
            return;
        }

        setIsAuthenticating(true);
        setMessage('Authenticating...');

        try {
            // Enhanced static image check
            if (checkForStaticImage()) {
                setMessage('Login using cellphone pictures is not allowed. Please use the live camera directly.');
                setIsAuthenticating(false);
                return;
            }

            // Additional movement check
            if (Date.now() - lastMovementTime > 3000) {
                setMessage('Please move slightly to confirm you are using a live camera.');
                setIsAuthenticating(false);
                return;
            }

            // Check for multiple faces
            const allDetections = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,       // Higher input size for better detection
                    scoreThreshold: 0.5   // Lower threshold to be more forgiving with different lighting
                })
            );

            if (allDetections.length === 0) {
                setMessage('No face detected. Try moving closer to the camera.');
                setIsAuthenticating(false);
                return;
            }

            if (allDetections.length > 1) {
                setMessage('Multiple faces detected. Make sure only your face is visible.');
                setIsAuthenticating(false);
                return;
            }

            // Get face landmarks and descriptor for the single face
            let faceWithLandmarks = await faceapi.detectSingleFace(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,        // Higher input size for better detection
                    scoreThreshold: 0.5    // Lower threshold to be more forgiving with different lighting
                })
            ).withFaceLandmarks().withFaceDescriptor();

            if (!faceWithLandmarks) {
                setMessage('Face features not clear. Try adjusting your position or lighting.');
                setIsAuthenticating(false);
                return;
            }

            // Use the state variable that already combines props and localStorage
            if (!userEmail) {
                // One last attempt to get the email from the DOM
                const domEmail = document.querySelector('.emailDisplay')?.textContent?.replace('Using email: ', '');
                
                console.log('Final attempt to get email from DOM:', domEmail);
                
                if (domEmail && domEmail.includes('@')) {
                    // Valid email found in DOM
                    setUserEmail(domEmail);
                } else {
                    console.log('No valid email found in any source');
                    setMessage('Email is missing. Please go back and try again.');
                    setIsAuthenticating(false);
                    return;
                }
            }

            console.log('Using email for authentication:', userEmail);
            setMessage('Face detected! Authenticating...');

            // Always include email in the payload
            const payload = {
                descriptor: Array.from(faceWithLandmarks.descriptor),
                email: userEmail
            };
            
            console.log("Authentication payload with email:", payload.email);

            // Send the face descriptor to the server for authentication
            const response = await fetch(`${API_BASE_URL}/api/authenticate-face`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Parse the response as JSON, handling potential errors
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Failed to parse response as JSON:', jsonError);
                throw new Error('Failed to parse authentication response. Please try again.');
            }

            // Check if the response was a 403 indicating Pending status
            if (response.status === 403 && data.isPendingStatus) {
                setMessage('Your application is currently being reviewed by our administrators.');
                setIsAuthenticating(false);
                return;
            }

            if (!response.ok) {
                const errorMessage = data?.error || `Authentication failed with status: ${response.status}`;
                throw new Error(errorMessage);
            }

            if (data.success) {
                setMessage('Authentication successful!');
                // Check if the user's status is Pending
                if (data.user && data.user.status === 'Pending') {
                    setMessage('Your application is currently being reviewed by our administrators.');
                    return;
                }
                // Call the onLoginSuccess callback with the user data
                if (onLoginSuccess) {
                    onLoginSuccess(data.user);
                }
            } else {
                setMessage(data.error || 'Authentication failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during authentication:', error);
            setMessage(error.message || 'Error during authentication. Please try again.');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const detectFaces = async () => {
        if (!isRunning || !modelsLoaded) return;

        try {
            const allDetections = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,       // Higher input size for better detection
                    scoreThreshold: 0.5   // Lower threshold to be more forgiving with different lighting
                })
            ).withFaceLandmarks();

            // Clear canvas
            const context = canvasRef.current.getContext('2d');
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            // Draw detections
            const displaySize = { 
                width: videoRef.current.width, 
                height: videoRef.current.height 
            };
            faceapi.matchDimensions(canvasRef.current, displaySize);
            const resizedDetections = faceapi.resizeResults(allDetections, displaySize);
            faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

            // Update message based on number of faces detected
            if (allDetections.length === 0) {
                setMessage('No face detected. Try moving closer to the camera.');
            } else if (allDetections.length > 1) {
                setMessage('Multiple faces detected. Make sure only your face is visible.');
            } else {
                setMessage('Face detected! You can now click "Authenticate" to login.');
            }

            // Continue detection loop
            requestAnimationFrame(detectFaces);
        } catch (error) {
            console.error('Error detecting faces:', error);
            setMessage('Error detecting faces. Please try again.');
        }
    };

    const registerFacePhoto = async () => {
        if (!modelsLoaded || isRegistering) {
            return;
        }

        // Check if we have a user ID (should only run on profile page, not login)
        const userId = localStorage.getItem('UserId');
        if (!userId) {
            setMessage('You must be logged in to register a face photo');
            return;
        }

        setIsRegistering(true);
        setMessage('Registering face photo...');

        try {
            // Get the current frame from video
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            
            // Convert to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
            const file = new File([blob], "face_recognition.jpg", { type: "image/jpeg" });

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'soloparent');
            formData.append('folder', `soloparent/users/${userId}/face_recognition`);

            // Upload to Cloudinary
            const cloudinaryResponse = await fetch(
                `https://api.cloudinary.com/v1_1/dskj7oxr7/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const cloudinaryData = await cloudinaryResponse.json();

            // Update the faceRecognitionPhoto in the database
            const updateResponse = await axios.post(
                `${API_BASE_URL}/updateUserProfile`,
                { 
                    userId: userId, 
                    faceRecognitionPhoto: cloudinaryData.secure_url 
                }
            );

            if (updateResponse.data.success) {
                setMessage('Face photo registered successfully!');
            } else {
                throw new Error('Failed to register face photo');
            }
        } catch (error) {
            console.error('Error registering face photo:', error);
            setMessage('Error registering face photo. Please try again.');
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div className="face-auth-container">
            <h2>Face Recognition Login</h2>
            
            {/* Hidden email input for face authentication */}
            <input type="hidden" id="faceAuthEmail" value={userEmail} />
            
            <div className="video-container">
                <video
                    ref={videoRef}
                    width="1000"
                    height="300"
                    autoPlay
                    muted
                />
                <canvas ref={canvasRef} />
            </div>
            <div className="controls">
                <button 
                    onClick={startCamera} 
                    disabled={isRunning || !modelsLoaded}
                    className="start-btn"
                >
                    Start Camera
                </button>
                <button 
                    onClick={authenticateUser} 
                    disabled={!isRunning || isAuthenticating}
                    className="authenticate-btn"
                >
                    {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
                </button>
                <button 
                    onClick={stopCamera} 
                    disabled={!isRunning}
                    className="stop-btn"
                >
                    Stop Camera
                </button>
            </div>
            {/* Only show register photo button when not on login page (no onLoginSuccess prop) */}
            {!onLoginSuccess && localStorage.getItem('UserId') && (
                <div className="register-controls">
                    <button 
                        onClick={registerFacePhoto}
                        disabled={!isRunning || isRegistering}
                        className="register-btn"
                    >
                        {isRegistering ? 'Registering...' : 'Register a Photo'}
                    </button>
                </div>
            )}
            {message && <p className="message">{message}</p>}
        </div>
    );
};

export default FaceAuth; 