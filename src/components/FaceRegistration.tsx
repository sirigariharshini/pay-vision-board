import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFaceDetection } from '@/hooks/useFaceDetection';

export const FaceRegistration = () => {
  const [name, setName] = useState('');
  const [rfidTag, setRfidTag] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { extractFaceEmbedding, isLoading: detectorLoading } = useFaceDetection();

  const CAPTURE_COUNT = 5; // Capture 5 frames for better accuracy like the Python version

  const startCamera = async () => {
    try {
      setIsVideoReady(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video metadata to load and ensure video has dimensions
        await new Promise<void>((resolve) => {
          const video = videoRef.current!;
          
          const onLoadedMetadata = () => {
            // Ensure video has valid dimensions
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              setIsVideoReady(true);
              toast.success('Camera ready! You can now capture faces.');
              resolve();
            }
          };
          
          if (video.readyState >= 2) {
            // Metadata already loaded
            onLoadedMetadata();
          } else {
            video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
          }
        });
        
        await videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
        });
      }
      
      setStream(mediaStream);
      setIsCapturing(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Failed to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setIsVideoReady(false);
  };

  const captureAndRegister = async () => {
    if (!videoRef.current || !name || !rfidTag) {
      toast.error('Please fill all fields and start camera');
      return;
    }

    if (!isVideoReady) {
      toast.error('Please wait for camera to be ready');
      return;
    }

    // Double-check video has valid dimensions
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Video not ready. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    setCaptureProgress(0);

    try {
      // Capture multiple embeddings for better accuracy (like Python version)
      const embeddings = [];
      toast.info(`Capturing ${CAPTURE_COUNT} images for training...`);
      
      for (let i = 0; i < CAPTURE_COUNT; i++) {
        setCaptureProgress(((i + 1) / CAPTURE_COUNT) * 100);
        
        // Wait between captures for slight variation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const embedding = await extractFaceEmbedding(videoRef.current!);
        if (!embedding) {
          toast.error(`Face not detected in capture ${i + 1}/${CAPTURE_COUNT}. Please keep face visible.`);
          setIsProcessing(false);
          setCaptureProgress(0);
          return;
        }
        embeddings.push(embedding);
      }

      // Average the embeddings for more robust recognition
      const avgEmbedding = {
        descriptor: embeddings[0].descriptor.map((_, idx) => {
          const sum = embeddings.reduce((acc, emb) => acc + emb.descriptor[idx], 0);
          return sum / embeddings.length;
        }),
        timestamp: Date.now()
      };

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', rfidTag)
        .single();

      if (existingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name,
            face_embedding: avgEmbedding as any
          })
          .eq('id', rfidTag);

        if (updateError) throw updateError;
        toast.success(`User face updated with ${CAPTURE_COUNT} training images!`);
      } else {
        // Create new user
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: rfidTag,
            name,
            balance: 0,
            face_embedding: avgEmbedding as any
          }]);

        if (insertError) throw insertError;
        toast.success(`User registered with ${CAPTURE_COUNT} training images!`);
      }

      // Reset form
      setName('');
      setRfidTag('');
      setCaptureProgress(0);
      stopCamera();
    } catch (err) {
      console.error('Error registering user:', err);
      toast.error('Failed to register user');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Register User Face + RFID
        </CardTitle>
        <CardDescription>
          Capture face and link it to RFID tag for secure payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">User Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter user name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rfid">RFID Tag</Label>
          <Input
            id="rfid"
            value={rfidTag}
            onChange={(e) => setRfidTag(e.target.value)}
            placeholder="Enter RFID tag ID"
          />
        </div>

        <div className="space-y-2">
          <Label>Camera Preview</Label>
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {isCapturing ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Camera className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!isCapturing ? (
            <Button onClick={startCamera} disabled={detectorLoading}>
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button onClick={stopCamera} variant="outline" disabled={isProcessing}>
                Stop Camera
              </Button>
              <Button 
                onClick={captureAndRegister} 
                disabled={!name || !rfidTag || isProcessing || !isVideoReady}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : !isVideoReady ? 'Camera Loading...' : 'Capture & Register'}
              </Button>
            </>
          )}
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Capturing multiple images for better accuracy...
            </p>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${captureProgress}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(captureProgress)}% complete ({CAPTURE_COUNT} images)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
