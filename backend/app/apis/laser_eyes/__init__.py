from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import Response
import cv2
import numpy as np
import databutton as db
import io
import logging
from typing import Optional
import os

router = APIRouter(prefix="/laser-eyes")

# Load laser eye overlay from static assets
laser_eye_path = os.path.join(os.path.dirname(__file__), "laser.png")
if not os.path.exists(laser_eye_path):
    # Save a default laser overlay if not exists
    laser_overlay = np.zeros((100, 300, 4), dtype=np.uint8)
    laser_overlay[:, :, 0] = 255  # Red channel
    laser_overlay[:, :, 3] = 255  # Alpha channel
    cv2.imwrite(laser_eye_path, laser_overlay)

@router.post("/add")
async def add_laser_eyes(image: UploadFile = File(...), intensity: float = Query(1.0, gt=0.0, le=1.5)):
    """
    Add laser eyes to an uploaded image.
    
    Parameters:
    - image: User uploaded image
    - intensity: Intensity of the laser effect (0.1-1.5)
    
    Returns:
    - The processed image with laser eyes
    """
    try:
        # Track the laser eye event
        db.storage.json.put(
            "laser_eye_usage",
            db.storage.json.get("laser_eye_usage", default={"count": 0})
        )
        
        # Read the image content
        contents = await image.read()
        
        # Convert to OpenCV format
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
            
        # Convert to RGB for better face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Load OpenCV's pre-trained face detector
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            # If no faces detected, try to just find eyes directly
            eyes = eye_cascade.detectMultiScale(gray, 1.3, 5)
        else:
            # Process each face and find eyes
            eyes = []
            for (x, y, w, h) in faces:
                roi_gray = gray[y:y+h, x:x+w]
                face_eyes = eye_cascade.detectMultiScale(roi_gray)
                # Adjust eye coordinates to the full image
                for (ex, ey, ew, eh) in face_eyes:
                    eyes.append((x + ex, y + ey, ew, eh))
        
        # If no eyes detected at all, raise an exception
        if len(eyes) == 0:
            raise HTTPException(status_code=400, detail="No eyes detected in the image")
        
        # Add laser effect to each eye
        for (x, y, w, h) in eyes:
            # Create a simple laser effect
            # Red color mask
            red_mask = np.zeros((img.shape[0], img.shape[1], 3), dtype=np.uint8)
            
            # Draw a laser beam from each eye
            center_x = x + w // 2
            center_y = y + h // 2
            
            # Draw the eye glow
            cv2.circle(red_mask, (center_x, center_y), int(w * 0.7), (0, 0, 255), -1)
            
            # Draw the laser beam
            beam_length = int(img.shape[1] * intensity)  # Beam length based on intensity
            end_x = center_x + beam_length
            cv2.line(red_mask, (center_x, center_y), (end_x, center_y), (0, 0, 255), thickness=w//2)
            
            # Apply a glowing effect
            red_mask = cv2.GaussianBlur(red_mask, (15, 15), 0)
            
            # Blend the laser effect with the original image
            alpha = 0.7  # Transparency factor
            img = cv2.addWeighted(img, 1.0, red_mask, alpha, 0)
        
        # Convert back to PNG
        _, buffer = cv2.imencode('.png', img)
        png_image = buffer.tobytes()
        
        # Return the processed image
        return Response(content=png_image, media_type="image/png")
    
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
