import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFaceDetection } from '@/hooks/useFaceDetection';

interface FaceVerificationProps {
  rfidTag: string;
  onVerified: (userId: string) => void;
  onFailed: () => void;
}

export const FaceVerification = ({ rfidTag, onVerified, onFailed }: FaceVerificationProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { extractFaceEmbedding, compareFaces } = useFaceDetection();

  useEffect(() => {
    startVerification();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error('Error accessing camera:', err);
      onFailed();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startVerification = async () => {
    await startCamera();
    setIsVerifying(true);
    
    // Wait for camera to initialize
    setTimeout(() => {
      verifyFace();
    }, 1000);
  };

  const verifyFace = async () => {
    if (!videoRef.current) {
      onFailed();
      return;
    }

    try {
      // Get user's stored face embedding
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, face_embedding')
        .eq('id', rfidTag)
        .single();

      if (error || !user || !user.face_embedding) {
        console.error('User not found or no face registered:', error);
        setVerificationStatus('failed');
        setTimeout(() => {
          stopCamera();
          onFailed();
        }, 2000);
        return;
      }

      // Extract current face embedding
      const currentEmbedding = await extractFaceEmbedding(videoRef.current);
      if (!currentEmbedding) {
        console.error('No face detected in camera');
        setVerificationStatus('failed');
        setTimeout(() => {
          stopCamera();
          onFailed();
        }, 2000);
        return;
      }

      // Compare embeddings
      const similarity = compareFaces(user.face_embedding as any, currentEmbedding);
      console.log('Face similarity:', similarity);

      // Threshold for face match (stricter for security)
      const SIMILARITY_THRESHOLD = 0.75;

      if (similarity >= SIMILARITY_THRESHOLD) {
        setVerificationStatus('success');
        
        // Record verification event
        await supabase.from('verification_events').insert({
          user_id: user.id,
          rfid_tag: rfidTag,
          face_verified: true,
          rfid_verified: true
        });

        setTimeout(() => {
          stopCamera();
          onVerified(user.id);
        }, 1500);
      } else {
        setVerificationStatus('failed');
        setTimeout(() => {
          stopCamera();
          onFailed();
        }, 2000);
      }
    } catch (err) {
      console.error('Error verifying face:', err);
      setVerificationStatus('failed');
      setTimeout(() => {
        stopCamera();
        onFailed();
      }, 2000);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Face Verification</h3>
        <p className="text-sm text-muted-foreground">
          Please look at the camera for verification
        </p>
      </div>

      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {verificationStatus !== 'idle' && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            {verificationStatus === 'success' ? (
              <div className="text-center space-y-2">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-lg font-semibold text-green-500">Verified!</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <XCircle className="w-16 h-16 text-destructive mx-auto" />
                <p className="text-lg font-semibold text-destructive">Verification Failed</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isVerifying && verificationStatus === 'idle' && (
        <div className="flex justify-center">
          <div className="animate-pulse text-sm text-muted-foreground">
            Verifying your face...
          </div>
        </div>
      )}
    </Card>
  );
};
