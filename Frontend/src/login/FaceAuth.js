import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './FaceAuth.css';

const FaceAuth = ({ onLoginSuccess }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isRunning, setIsRunning] = useState(false);
    const [stream, setStream] = useState(null);
    const [message, setMessage] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [previousFrames, setPreviousFrames] = useState([]);
    const [staticFrameCount, setStaticFrameCount] = useState(0);
    const [lastMovementTime, setLastMovementTime] = useState(Date.now());

    useEffect(() => {
        loadModels();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

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
                new faceapi.TinyFaceDetectorOptions()
            );

            if (allDetections.length === 0) {
                setMessage('No face detected. Please position your face in the camera.');
                setIsAuthenticating(false);
                return;
            }

            if (allDetections.length > 1) {
                setMessage('Multiple faces detected. Please ensure only your face is visible in the camera.');
                setIsAuthenticating(false);
                return;
            }

            // Get face landmarks and descriptor for the single face
            const faceWithLandmarks = await faceapi.detectSingleFace(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptor();

            if (!faceWithLandmarks) {
                setMessage('Face detection failed. Please try again.');
                setIsAuthenticating(false);
                return;
            }

            // Send the face descriptor to the server for authentication
            const response = await fetch('http://localhost:8081/api/authenticate-face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    descriptor: Array.from(faceWithLandmarks.descriptor)
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please try logging in again.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setMessage('Authentication successful!');
                // Call the onLoginSuccess callback with the user data
                if (onLoginSuccess) {
                    onLoginSuccess(data.user);
                }
            } else {
                setMessage(data.error || 'Authentication failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during authentication:', error);
            setMessage('Error during authentication. Please try again.');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const detectFaces = async () => {
        if (!isRunning || !modelsLoaded) return;

        try {
            const allDetections = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions()
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
                setMessage('No face detected. Please position your face in the camera.');
            } else if (allDetections.length > 1) {
                setMessage('Multiple faces detected. Please ensure only your face is visible.');
            } else {
                setMessage('Face detected. Ready for authentication.');
            }

            // Continue detection loop
            requestAnimationFrame(detectFaces);
        } catch (error) {
            console.error('Error detecting faces:', error);
            setMessage('Error detecting faces. Please try again.');
        }
    };

    return (
        <div className="face-auth-container">
            <h2>Face Recognition Login</h2>
            <div className="video-container">
                <video
                    ref={videoRef}
                    width="720"
                    height="560"
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
            {message && <p className="message">{message}</p>}
        </div>
    );
};

export default FaceAuth; 