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

    const authenticateUser = async () => {
        if (!modelsLoaded || isAuthenticating) {
            return;
        }

        setIsAuthenticating(true);
        setMessage('Authenticating...');

        try {
            const detections = await faceapi.detectSingleFace(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptor();

            if (!detections) {
                setMessage('No face detected. Please position your face in the camera.');
                setIsAuthenticating(false);
                return;
            }

            // Send the face descriptor to the server for authentication
            const response = await fetch('http://localhost:8081/api/authenticate-face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    descriptor: Array.from(detections.descriptor)
                })
            });

            if (!response.ok) {
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
            const detections = await faceapi.detectAllFaces(
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
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

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