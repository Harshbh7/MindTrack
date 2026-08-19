import { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

export const useFaceDetection = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [expressions, setExpressions] = useState<faceapi.FaceExpressions | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 1. Load Models 
    useEffect(() => {
        const loadModels = async () => {
            try {
                // console.log("Starting model load...");
                const MODEL_URL = "/models";
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), // Presence
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL), // Emotions
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL), // Landmarks (Head Pose)
                ]);
                // console.log("Models loaded successfully");
                setIsModelLoaded(true);
            } catch (err: any) {
                console.error("Model loading failed:", err);
                setError(err.message || "Failed to load AI models");
            }
        };
        loadModels();
    }, []);

    // 2. Continuous Detection
    useEffect(() => {
        if (!isModelLoaded) return;

        const detectFace = async () => {
            // Safety check: video must be playing and have dimensions
            if (
                videoRef.current &&
                videoRef.current.readyState === 4 &&
                !videoRef.current.paused
            ) {
                try {
                    // Detect face + Landmarks (true means use tiny landmark model) + Expressions
                    const detections = await faceapi.detectAllFaces(
                        videoRef.current,
                        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                    ).withFaceLandmarks(true).withFaceExpressions();

                    const detected = detections.length > 0;

                    if (detected) {
                        const face = detections[0];
                        setExpressions(face.expressions);

                        // Head Pose Heuristics (Yaw - looking left/right)
                        const landmarks = face.landmarks;
                        const nose = landmarks.getNose()[3]; // Tip of nose
                        const jawline = landmarks.getJawOutline();
                        const leftEdge = jawline[0];
                        const rightEdge = jawline[16];

                        // 1. Yaw (Left / Right)
                        const leftDist = nose.x - leftEdge.x;
                        const rightDist = rightEdge.x - nose.x;
                        const yawRatio = leftDist / Math.max(rightDist, 1);
                        const isLookingLeftRight = yawRatio < 0.6 || yawRatio > 1.6;

                        // 2. Pitch (Up / Down)
                        const noseBridge = landmarks.getNose()[0];
                        const chin = jawline[8];
                        const topDist = nose.y - noseBridge.y;
                        const bottomDist = chin.y - nose.y;
                        const pitchRatio = topDist / Math.max(bottomDist, 1);
                        // Normal pitchRatio is usually between 0.6 and 1.0 depending on face structure.
                        // Looking UP: nose tip gets closer to bridge, chin gets further -> ratio drops
                        // Looking DOWN: nose tip gets further from bridge, chin gets closer -> ratio grows
                        const isLookingUpDown = pitchRatio < 0.4 || pitchRatio > 1.5;

                        // 3. Eye Aspect Ratio (Are eyes open?)
                        const leftEye = landmarks.getLeftEye();
                        const rightEye = landmarks.getRightEye();

                        // helper to get distance between two points
                        const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

                        const calcEAR = (eye: any[]) => {
                            // eye is an array of 6 points
                            const vertical1 = dist(eye[1], eye[5]);
                            const vertical2 = dist(eye[2], eye[4]);
                            const horizontal = dist(eye[0], eye[3]);
                            return (vertical1 + vertical2) / (2.0 * horizontal);
                        };

                        const leftEAR = calcEAR(leftEye);
                        const rightEAR = calcEAR(rightEye);
                        const avgEAR = (leftEAR + rightEAR) / 2;

                        // EAR < 0.2 usually means eyes are closed or squinting very heavily
                        const isEyesClosed = avgEAR < 0.22;

                        const isLookingAway = isLookingLeftRight || isLookingUpDown || isEyesClosed;

                        // Only count as "detected" if they are looking relatively straight and eyes are open
                        setIsFaceDetected(!isLookingAway);

                    } else {
                        setExpressions(null);
                        setIsFaceDetected(false);
                    }

                } catch (err) {
                    console.error("Detection error:", err);
                }
            } else {
                setIsFaceDetected(false);
                setExpressions(null);
            }
        };

        // Run detection loop safely
        let isLooping = true;
        const detectionLoop = async () => {
            if (!isLooping) return;
            await detectFace();
            if (isLooping) setTimeout(detectionLoop, 500);
        };

        detectionLoop();

        return () => {
            isLooping = false;
        };
    }, [isModelLoaded]);

    return { isModelLoaded, isFaceDetected, expressions, error };
};
