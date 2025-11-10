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
  const videoRef = useRef<HTMLVideoElement>(null);
  const { extractFaceEmbedding, isLoading: detectorLoading } = useFaceDetection();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsCapturing(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const captureAndRegister = async () => {
    if (!videoRef.current || !name || !rfidTag) {
      toast.error('Please fill all fields and start camera');
      return;
    }

    try {
      const embedding = await extractFaceEmbedding(videoRef.current);
      if (!embedding) {
        toast.error('No face detected. Please position your face in the camera');
        return;
      }

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
            face_embedding: embedding as any
          })
          .eq('id', rfidTag);

        if (updateError) throw updateError;
        toast.success('User face updated successfully!');
      } else {
        // Create new user
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: rfidTag,
            name,
            balance: 0,
            face_embedding: embedding as any
          }]);

        if (insertError) throw insertError;
        toast.success('User registered successfully!');
      }

      // Reset form
      setName('');
      setRfidTag('');
      stopCamera();
    } catch (err) {
      console.error('Error registering user:', err);
      toast.error('Failed to register user');
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
              <Button onClick={stopCamera} variant="outline">
                Stop Camera
              </Button>
              <Button onClick={captureAndRegister} disabled={!name || !rfidTag}>
                <UserPlus className="w-4 h-4 mr-2" />
                Capture & Register
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
