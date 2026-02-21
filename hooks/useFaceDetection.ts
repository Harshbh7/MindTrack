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
                    // Detect face + Expressions
                    const detections = await faceapi.detectAllFaces(
                        videoRef.current,
                        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                    ).withFaceExpressions();

                    const detected = detections.length > 0;
                    setIsFaceDetected(detected);

                    if (detected) {
                        // Get expressions from the first face found
                        setExpressions(detections[0].expressions);
                    } else {
                        setExpressions(null);
                    }

                } catch (err) {
                    console.error("Detection error:", err);
                }
            } else {
                setIsFaceDetected(false);
                setExpressions(null);
            }
        };

        // Run detection loop
        const intervalId = setInterval(detectFace, 500);

        return () => clearInterval(intervalId);
    }, [isModelLoaded]);

    return { isModelLoaded, isFaceDetected, expressions, error };
};
