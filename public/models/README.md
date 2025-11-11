# Face-API.js Models

This directory should contain the face-api.js model files.

## Required Files

Download these files from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Place the following files in this directory:

### Tiny Face Detector (lightweight face detection)
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`

### Face Landmark 68 (facial landmark detection)
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`

### Face Recognition (128D face descriptors for recognition)
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`

## How to Download

1. Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Download all files listed above
3. Place them directly in this `/public/models/` folder
4. Restart your development server

## Verification

After placing the files, you should see console logs like:
```
🔄 Loading face-api.js models from /models...
✅ All face-api.js models loaded successfully!
```

If you see errors, ensure:
- Files are in `/public/models/` (not a subdirectory)
- File names match exactly (case-sensitive)
- Your dev server has been restarted
