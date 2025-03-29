import mediapipe as mp
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends, Response, Query
import databutton as db
from typing import Dict, Optional, List
import io
import base64
import time
import json
import re
import uuid
from datetime import datetime
from app.apis.openai import generate_meme_text, MemeGenerationRequest
# Import image generation functions from the main OpenAI module
from app.apis.openai import transform_image_with_gpt4_vision, get_openai_client
# Import showcase module
from app.apis.showcase import add_to_showcase
# Import viral meme generation function
from app.apis.image_generation import generate_viral_meme_image
# Import common functions for analytics and template management
from app.apis.common import sanitize_storage_key, TemplateManager, track_event as track_common_event, get_analytics_data

router = APIRouter(prefix="/faceswap")

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1)

# Storage key for meme template images
MEME_TEMPLATES_KEY = "meme_templates"
USAGE_STATS_KEY = "faceswap_usage_stats"

# Define available meme templates
DEFAULT_TEMPLATES = {
    "doge": {
        "name": "Doge",
        "description": "The iconic shiba inu meme that took over the internet and became a viral sensation",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/doge_classic.jpg"  # Updated Doge
    },
    "pepe": {
        "name": "Pepe",
        "description": "The internet's favorite green frog character used in countless viral memes",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/ChatGPT Image Mar 28, 2025, 11_58_36 AM.png"  # Updated Pepe
    },
    "anime": {
        "name": "Anime",
        "description": "Transform your photo into a stylized anime character with distinct artistic features",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/file_00000000928852468decc77efd909c92_conversation_id=67e42e9d-b378-8003-afe2-ca6fdc84d963&message_id=16979e61-8b17-412d-849f-c7271c151ca6.webp"  # Updated anime template
    },
    "btc_laser_eyes": {
        "name": "Laser Eyes",
        "description": "Add intense glowing laser eyes to your portrait for a dramatic viral meme effect",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/laser_eyes_generic.jpg"  # Updated laser eyes image
    },
    "voxel": {
        "name": "Voxel Art",
        "description": "Transform your photo into vibrant 3D voxel art with stylized elements",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/file_000000001090520a96b4eeaa61403280_conversation_id=67e40412-11a8-8003-878c-174ffd4aa7b3&message_id=60b508bb-3d6c-4590-bbbf-f2b0ded02e45.webp",  # User-provided voxel art example
        "prompt": "Transform the user's image accurately into a detailed voxel art style. Precisely preserve original facial features, including facial expressions, hairstyle, eyes, mouth, and nose shape. Apply vibrant, cube-based voxel aesthetics and textures, creating a playful 3D pixelated appearance similar to game art. Add subtle stylized elements or patterns in the background. Fully retain the original photo composition while adding these elements."
    }
}

# Initialize template manager with default templates
template_manager = TemplateManager(MEME_TEMPLATES_KEY, USAGE_STATS_KEY, DEFAULT_TEMPLATES)

# Extended track_template_usage function to handle transform_method
def track_template_usage_extended(template_id: str, success: bool = True, error_type: str = None, transform_method: str = None):
    """Enhanced template usage tracking with transform_method support"""
    try:
        # First use the common tracking function for basic stats
        template_manager.track_template_usage(template_id, success, error_type)
        
        # Then handle transform_method if provided (specific to faceswap)
        if transform_method and success:
            try:
                # Get existing stats
                stats = db.storage.json.get(sanitize_storage_key(USAGE_STATS_KEY))
                
                # Initialize method tracking if needed
                if "methods" not in stats:
                    stats["methods"] = {}
                if transform_method not in stats["methods"]:
                    stats["methods"][transform_method] = 0
                stats["methods"][transform_method] = stats["methods"].get(transform_method, 0) + 1
                
                # Template-specific method tracking
                if template_id in stats["templates"]:
                    if "methods" not in stats["templates"][template_id]:
                        stats["templates"][template_id]["methods"] = {}
                    if transform_method not in stats["templates"][template_id]["methods"]:
                        stats["templates"][template_id]["methods"][transform_method] = 0
                    stats["templates"][template_id]["methods"][transform_method] += 1
                
                # Save updated stats
                db.storage.json.put(sanitize_storage_key(USAGE_STATS_KEY), stats)
            except Exception as method_error:
                print(f"Error tracking transform method: {str(method_error)}")
    except Exception as e:
        # Don't let analytics errors disrupt the main functionality
        print(f"Error in extended template usage tracking: {str(e)}")

# Functions for face detection and transformation
def detect_face_landmarks(image):
    """Detect facial landmarks using MediaPipe Face Mesh"""
    img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = mp_face_mesh.process(img_rgb)
    landmarks = results.multi_face_landmarks
    return landmarks

def extract_face_mesh(landmarks, image_shape):
    """Extract a more comprehensive set of facial landmarks from MediaPipe results"""
    if not landmarks:
        return None
    
    # Get key points for alignment (using more points for better accuracy)
    # We'll use more landmarks for better face alignment
    key_points = [
        # Eyes
        33, 133,  # Left eye corners
        362, 263,  # Right eye corners
        # Nose
        4, 5, 6,  # Nose bridge and tip
        # Mouth
        61, 291,  # Mouth corners
        # Eyebrows
        70, 105,  # Left eyebrow
        336, 300  # Right eyebrow
    ]
    
    # Extract the coordinates
    points = []
    for idx in key_points:
        if idx < len(landmarks[0].landmark):
            lm = landmarks[0].landmark[idx]
            points.append([lm.x * image_shape[1], lm.y * image_shape[0]])
    
    return np.float32(points)

def create_face_mask(landmarks, image_shape):
    """Create a mask of the face area based on landmarks"""
    if not landmarks:
        return None
    
    mask = np.zeros(image_shape[:2], dtype=np.uint8)
    
    # Get face outline points
    face_outline = []
    # Jawline points (usually indices 0-16 in MediaPipe)
    for i in range(0, 17):
        lm = landmarks[0].landmark[i]
        face_outline.append([int(lm.x * image_shape[1]), int(lm.y * image_shape[0])])
    
    # Add some forehead points (approximate by extending above certain landmarks)
    for i in [19, 24, 151, 337, 338, 396]:
        lm = landmarks[0].landmark[i]
        # Move these points up to create forehead outline
        x = int(lm.x * image_shape[1])
        y = int(lm.y * image_shape[0]) - 30  # Move up by 30 pixels
        face_outline.append([x, y])
    
    # Convert to numpy array and draw filled polygon
    face_outline = np.array(face_outline, dtype=np.int32)
    cv2.fillPoly(mask, [face_outline], 255)
    
    # Smooth the mask edges
    mask = cv2.GaussianBlur(mask, (11, 11), 10)
    
    return mask

def meme_face_swap(user_image, meme_template_image):
    """Swap faces between user image and meme template with improved blending"""
    # Detect facial landmarks
    user_landmarks = detect_face_landmarks(user_image)
    meme_landmarks = detect_face_landmarks(meme_template_image)

    if not user_landmarks or not meme_landmarks:
        raise ValueError("Face detection failed on one of the images. Make sure faces are clearly visible.")

    # Extract key points for alignment
    points_user = extract_face_mesh(user_landmarks, user_image.shape)
    points_meme = extract_face_mesh(meme_landmarks, meme_template_image.shape)
    
    if points_user is None or points_meme is None or len(points_user) < 3 or len(points_meme) < 3:
        raise ValueError("Couldn't extract enough facial landmarks. Try a clearer photo.")

    # Create transformation matrix using perspective transform for better alignment
    # We'll use at least 4 points for perspective transform, or fallback to affine transform
    if len(points_user) >= 4 and len(points_meme) >= 4:
        matrix = cv2.getPerspectiveTransform(points_user[:4], points_meme[:4])
        transformed_face = cv2.warpPerspective(user_image, matrix, (meme_template_image.shape[1], meme_template_image.shape[0]))
    else:
        # Fallback to affine transform with at least 3 points
        matrix = cv2.getAffineTransform(points_user[:3], points_meme[:3])
        transformed_face = cv2.warpAffine(user_image, matrix, (meme_template_image.shape[1], meme_template_image.shape[0]))

    # Create face masks for better blending
    user_face_mask = create_face_mask(user_landmarks, transformed_face.shape)
    meme_face_mask = create_face_mask(meme_landmarks, meme_template_image.shape)
    
    if user_face_mask is None or meme_face_mask is None:
        # If mask creation fails, fall back to a simple circle mask
        face_center = np.mean(points_meme, axis=0).astype(int)
        radius = int(np.max(np.std(points_meme, axis=0)) * 2.5) # Estimate face size
        mask = np.zeros(meme_template_image.shape[:2], dtype=np.uint8)
        cv2.circle(mask, (face_center[0], face_center[1]), radius, 255, -1)
        mask = cv2.GaussianBlur(mask, (21, 21), 11)
    else:
        # Combine both masks for better results
        mask = cv2.bitwise_and(user_face_mask, meme_face_mask)
        mask = cv2.GaussianBlur(mask, (11, 11), 5)  # Smooth the mask edges
    
    # Normalize mask to range 0-1 for blending
    mask_normalized = mask.astype(float) / 255.0
    mask_normalized = np.stack([mask_normalized] * 3, axis=2) # Make 3-channel for RGB blending

    # Color correction to better match the template's style
    transformed_face = cv2.addWeighted(transformed_face, 0.8, meme_template_image, 0.2, 0)

    # Alpha blend the images using the mask
    blended_image = transformed_face * mask_normalized + meme_template_image * (1 - mask_normalized)
    blended_image = blended_image.astype(np.uint8)

    # Final stylistic adjustments to better match viral meme aesthetics
    # Slightly increase contrast and apply a subtle color grading
    blended_image = cv2.convertScaleAbs(blended_image, alpha=1.1, beta=5)

    return blended_image

def generate_meme(user_image_bytes, meme_template_image_bytes):
    """Generate meme from user image and template image bytes"""
    user_image = cv2.imdecode(np.frombuffer(user_image_bytes, np.uint8), cv2.IMREAD_COLOR)
    meme_template_image = cv2.imdecode(np.frombuffer(meme_template_image_bytes, np.uint8), cv2.IMREAD_COLOR)

    if user_image is None:
        raise ValueError("Invalid user image.")
    if meme_template_image is None:
        raise ValueError("Invalid meme template image.")

    # Resize images for consistent processing if they're too large
    max_dimension = 1024
    user_h, user_w = user_image.shape[:2]
    template_h, template_w = meme_template_image.shape[:2]
    
    # Resize user image if needed
    if max(user_h, user_w) > max_dimension:
        scale = max_dimension / max(user_h, user_w)
        user_image = cv2.resize(user_image, (int(user_w * scale), int(user_h * scale)))
    
    # Resize template image if needed
    if max(template_h, template_w) > max_dimension:
        scale = max_dimension / max(template_h, template_w)
        meme_template_image = cv2.resize(meme_template_image, (int(template_w * scale), int(template_h * scale)))

    result_image = meme_face_swap(user_image, meme_template_image)
    _, result_img_encoded = cv2.imencode('.png', result_image)
    
    return result_img_encoded.tobytes()

# We'll use template_manager.get_templates() instead of initialize_templates()

# Get template data and image
def get_template(template_id: str):
    """Get template data and image bytes"""
    templates = template_manager.get_templates()
    if template_id not in templates:
        raise ValueError(f"Template '{template_id}' not found")
    
    template = templates[template_id]
    template_key = f"template_{template_id}_image"
    sanitized_key = sanitize_storage_key(template_key)
    
    print(f"Looking for template {template_id} with key {sanitized_key}")
    
    try:
        # First try with the _image suffix
        try:
            image_bytes = db.storage.binary.get(sanitized_key)
            print(f"Found template image with key {sanitized_key}")
        except FileNotFoundError:
            # Then try without the _image suffix
            alt_key = sanitize_storage_key(f"template_{template_id}")
            print(f"Template image not found with key {sanitized_key}, trying {alt_key}")
            image_bytes = db.storage.binary.get(alt_key)
            
            # Store it with the correct key for next time
            print(f"Found template with alternate key {alt_key}, copying to {sanitized_key}")
            db.storage.binary.put(sanitized_key, image_bytes)
    except FileNotFoundError:
        # If not cached, fetch from URL
        print(f"Template not found in storage, fetching from URL: {template['url']}")
        try:
            import requests
            response = requests.get(template["url"])
            if response.status_code != 200:
                raise ValueError(f"Failed to fetch template image for {template_id}: HTTP {response.status_code}")
            image_bytes = response.content
            # Cache for future use
            db.storage.binary.put(sanitized_key, image_bytes)
            print(f"Downloaded and stored template image for {template_id}")
        except Exception as e:
            print(f"Error fetching template: {str(e)}")
            raise ValueError(f"Error fetching template: {str(e)}")
    
    return template, image_bytes

# API endpoints
@router.get("/templates")
def get_templates():
    """Get available meme templates"""
    return template_manager.get_templates()

@router.post("/transform")
async def transform_image(
    user_image: UploadFile = File(...),
    template_id: str = Form(...),
    custom_prompt: Optional[str] = Form(None),
    generate_caption: Optional[bool] = Form(False),
    use_ai_transform: Optional[bool] = Form(True)  # New parameter to control transformation method
):
    """Transform user image using specified meme template
    
    This endpoint takes a user's face photo and transforms it using a selected meme template.
    It preserves the user's facial features while applying the style of the meme template.
    
    Args:
        user_image: The user's face photo to transform
        template_id: The ID of the meme template to use
        custom_prompt: Optional custom prompt for transformation guidance
        generate_caption: Whether to generate a caption for the meme
        use_ai_transform: Whether to use GPT-4o Vision (True) or OpenCV (False)
        
    Returns:
        A PNG image of the transformed photo
        
    Raises:
        400: Invalid image or template
        404: Template not found
        500: Processing error
    """
    start_time = time.time()  # For tracking processing time
    
    try:
        # Check file type
        content_type = user_image.content_type
        if not content_type or not content_type.startswith('image/'):
            track_template_usage_extended(template_id, False, "invalid_file_type")
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only images are accepted."
            )
        
        # Get user image bytes
        user_image_bytes = await user_image.read()
        if not user_image_bytes:
            track_template_usage_extended(template_id, False, "empty_file")
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Get template info (we need this regardless of transformation method)
        try:
            template, template_image_bytes = get_template(template_id)
        except ValueError as e:
            track_template_usage_extended(template_id, False, "template_not_found")
            raise HTTPException(status_code=404, detail=str(e))
        
        # Set default headers for the response
        response_headers = {
            "X-Processing-Time": str(0.0),   # Will be updated at the end
            "X-Template-Used": template_id,
            "X-Transform-Method": "pending",  # Will be updated later
            "X-Image-Model-Used": "opencv",   # Default, will be overridden if AI is used
            "Cache-Control": "public, max-age=86400"  # Cache for 24 hours
        }
        
        # Process the image using either GPT-4o Vision or the traditional method
        if use_ai_transform:
            try:
                # Get OpenAI client
                client = get_openai_client()
                
                # Use GPT-4o Vision for transformation
                result_bytes, transform_method = await transform_image_with_gpt4_vision(
                    client, 
                    user_image_bytes, 
                    template_id, 
                    custom_prompt
                )
            except Exception as e:
                error_message = str(e)
                print(f"GPT-4o Vision transform error: {error_message}")
                track_template_usage_extended(template_id, False, "gpt4o_vision_error")
                
                # Try new viral meme generation as first fallback
                try:
                    print("Trying viral meme generation with OpenAI...")
                    result_bytes, transform_method = await generate_viral_meme_image(
                        user_image_bytes, 
                        template_id
                    )
                    # If successful, we'll continue with this result
                except Exception as viral_error:
                    print(f"Viral meme generation error: {str(viral_error)}")
                    track_template_usage_extended(template_id, False, "viral_meme_generation_error")
                    
                    # Fallback to traditional method as last resort
                    print("Falling back to traditional face swap method")
                    try:
                        result_bytes = generate_meme(user_image_bytes, template_image_bytes)
                        transform_method = "opencv_fallback"
                    except ValueError as fallback_error:
                        # Handle errors from traditional method
                        fallback_error_message = str(fallback_error)
                        if "face detection failed" in fallback_error_message.lower():
                            track_template_usage_extended(template_id, False, "face_detection_failed")
                            raise HTTPException(
                                status_code=400, 
                                detail="No face detected in the image. Please upload a clear photo with a visible face."
                            )
                        elif "facial landmarks" in fallback_error_message.lower():
                            track_template_usage_extended(template_id, False, "facial_landmarks_failed")
                            raise HTTPException(
                                status_code=400, 
                                detail="Couldn't detect facial features clearly. Please upload a photo with a clear, well-lit face looking directly at the camera."
                            )
                        else:
                            track_template_usage_extended(template_id, False, "value_error")
                            raise HTTPException(status_code=400, detail=fallback_error_message)
                    except Exception as fallback_e:
                        print(f"Fallback method error: {str(fallback_e)}")
                        track_template_usage_extended(template_id, False, "fallback_processing_error")
                        raise HTTPException(
                            status_code=500, 
                            detail="Failed to process images with all methods. Please try with a different photo."
                        )
        else:
            # Use traditional OpenCV-based method
            try:
                result_bytes = generate_meme(user_image_bytes, template_image_bytes)
                transform_method = "opencv"
            except ValueError as e:
                # More specific error handling for face detection issues
                error_message = str(e)
                if "face detection failed" in error_message.lower():
                    track_template_usage_extended(template_id, False, "face_detection_failed")
                    raise HTTPException(
                        status_code=400, 
                        detail="No face detected in the image. Please upload a clear photo with a visible face."
                    )
                elif "facial landmarks" in error_message.lower():
                    track_template_usage_extended(template_id, False, "facial_landmarks_failed")
                    raise HTTPException(
                        status_code=400, 
                        detail="Couldn't detect facial features clearly. Please upload a photo with a clear, well-lit face looking directly at the camera."
                    )
                else:
                    track_template_usage_extended(template_id, False, "value_error")
                    raise HTTPException(status_code=400, detail=error_message)
            except Exception as e:
                print(f"Error in meme generation: {str(e)}")
                track_template_usage_extended(template_id, False, "processing_error")
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to process images. Our face detection system encountered an issue. Please try with a different photo."
                )
        
        # Prepare response
        processing_time = time.time() - start_time
        
        # Track successful usage
        track_template_usage_extended(template_id, True, transform_method=transform_method)
        
        # Update response headers with transformation info
        response_headers["X-Image-Model-Used"] = transform_method
        response_headers["X-Transform-Method"] = transform_method
        response_headers["X-Processing-Time"] = f"{processing_time:.2f}"
        
        # Generate meme caption if requested
        caption = None
        alternatives = []
        text_model = None
        if generate_caption:
            try:
                # Call the OpenAI API to generate a caption
                caption_response = await generate_meme_text(
                    MemeGenerationRequest(
                        template_id=template_id,
                        prompt=custom_prompt,
                        style="funny",
                        context={"transform_method": transform_method}
                    )
                )
                
                # Extract caption, alternatives and model used
                caption = caption_response.caption
                alternatives = caption_response.alternative_captions
                
                # Check if model info is available
                if hasattr(caption_response, 'model_used'):
                    text_model = caption_response.model_used
                    response_headers["X-Text-Model-Used"] = text_model
            except Exception as e:
                print(f"Caption generation error (non-critical): {str(e)}")
                # We don't want to fail the whole request if caption generation fails
        
        # If we generated a caption, add it to headers
        if caption:
            try:
                # Sanitize header values to ensure they're ASCII compatible
                sanitized_caption = caption.encode('ascii', 'ignore').decode('ascii')
                response_headers["X-Meme-Caption"] = sanitized_caption
                
                # Add alternatives as JSON in a header if there are any
                if alternatives:
                    # Sanitize alternatives before JSON encoding
                    sanitized_alternatives = [alt.encode('ascii', 'ignore').decode('ascii') for alt in alternatives[:2]]
                    response_headers["X-Alternative-Captions"] = json.dumps(sanitized_alternatives)  # Limit to 2 alternatives to keep header size reasonable
            except Exception as e:
                print(f"Warning: Could not add caption to headers: {str(e)}")
                # Continue without caption headers rather than failing the request
        
        # Convert result bytes to base64 data URL for showcase if needed
        image_data_url = f"data:image/png;base64,{base64.b64encode(result_bytes).decode('utf-8')}"
        
        # Add to public showcase with 50% probability (for demo purposes)
        # In production you'd use quality metrics or user opt-in
        try:
            templates = get_templates()
            if template_id in templates:
                template = templates[template_id]
                if np.random.random() > 0.5:  # Add ~50% of transformations to showcase
                    add_to_showcase(
                        template_id=template_id,
                        template_name=template["name"],
                        template_description=template["description"],
                        template_url=template["url"],
                        result_url=image_data_url,
                        caption=caption
                    )
        except Exception as e:
            # Don't fail the API if showcase add fails
            print(f"Error adding to showcase: {str(e)}")
        
        return Response(
            content=result_bytes,
            media_type="image/png",
            headers=response_headers
        )
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        print(f"Unexpected transformation error: {str(e)}")
        track_template_usage_extended(template_id, False, "unexpected_error")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred. Please try again with a different photo."
        )

@router.get("/analytics", operation_id="get_faceswap_analytics")
async def get_faceswap_analytics():
    """Get analytics data for admin dashboard
    
    This endpoint returns usage statistics for the FaceSwap API.
    It shows which templates are popular and any errors that users encountered.
    """
    try:
        # Use common analytics function with our template manager
        return get_analytics_data(template_manager)
    except Exception as e:
        print(f"Error getting analytics data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve analytics data")

# Track external events like page views or button clicks
@router.post("/track_event", operation_id="track_faceswap_event")
async def track_faceswap_event(event_data: dict):
    """Track custom events
    
    This endpoint allows tracking custom events like page views or button clicks.
    """
    try:
        # Use common track_event function
        result = track_common_event(event_data.get("type", "unknown"), event_data)
        return {"success": result.get("success", False)}
    except Exception as e:
        print(f"Error tracking event: {str(e)}")
        return {"success": False, "error": str(e)}

# Create a public endpoint version of templates that doesn't require authentication
@router.get("/templates/public", operation_id="get_templates_public2")
def get_templates_public2():
    """Get available meme templates - publicly accessible endpoint"""
    return get_templates()

# No need to explicitly initialize templates, the TemplateManager handles this
