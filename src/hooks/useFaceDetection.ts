import { useEffect, useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';

export interface FaceEmbedding {
  descriptor: number[];
  timestamp: number;
}

export const useFaceDetection = () => {
  const [detector, setDetector] = useState<faceDetection.FaceDetector | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDetector = async () => {
      try {
        await tf.ready();
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = {
          runtime: 'tfjs' as const,
        };
        const det = await faceDetection.createDetector(model, detectorConfig);
        setDetector(det);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing face detector:', err);
        setError('Failed to initialize face detection');
        setIsLoading(false);
      }
    };

    initDetector();
  }, []);

  const detectFaces = async (videoElement: HTMLVideoElement) => {
    if (!detector) {
      console.error('❌ Detector not initialized');
      return null;
    }
    if (!videoElement) {
      console.error('❌ Video element is null');
      return null;
    }
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.error('❌ Video has no dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      return null;
    }
    
    try {
      console.log('🔍 Attempting face detection on video:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      const faces = await detector.estimateFaces(videoElement, { flipHorizontal: false });
      console.log('📊 Detection result:', faces?.length || 0, 'faces found');
      return faces;
    } catch (err) {
      console.error('❌ Error detecting faces:', err);
      return null;
    }
  };

  const extractFaceEmbedding = async (videoElement: HTMLVideoElement): Promise<FaceEmbedding | null> => {
    const faces = await detectFaces(videoElement);
    if (!faces || faces.length === 0) return null;

    const face = faces[0];
    const keypoints = face.keypoints;
    
    // Create a simple embedding from facial keypoints
    const descriptor = keypoints.flatMap(kp => [kp.x, kp.y]);
    
    return {
      descriptor,
      timestamp: Date.now()
    };
  };

  const compareFaces = (embedding1: FaceEmbedding, embedding2: FaceEmbedding): number => {
    // Calculate Euclidean distance between embeddings
    const desc1 = embedding1.descriptor;
    const desc2 = embedding2.descriptor;
    
    if (desc1.length !== desc2.length) return 0;
    
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
      sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    
    const distance = Math.sqrt(sum);
    
    // Normalize distance to 0-1 range where 1 is identical
    // Using a more conservative normalization based on typical face keypoint distances
    const normalizedDistance = distance / (desc1.length * 100);
    const similarity = Math.max(0, Math.min(1, 1 - normalizedDistance));
    
    return similarity;
  };

  return {
    detector,
    isLoading,
    error,
    detectFaces,
    extractFaceEmbedding,
    compareFaces
  };
};
