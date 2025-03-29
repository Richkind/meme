from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from pydantic import BaseModel
import databutton as db
from typing import Dict, Optional, List, Any
import google.generativeai as genai
import base64
from datetime import datetime

# Import common functions
from app.apis.common import sanitize_storage_key, TemplateManager

# Define available meme templates with Gemini-specific prompts
DEFAULT_TEMPLATES = {
    "doge": {
        "name": "Doge",
        "description": "The iconic Shiba Inu meme that became a global sensation",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/doge_classic.jpg",
        "prompt": "Transform this person into the iconic 'Doge' Shiba Inu meme. Keep their pose and expression, but make them look like the famous Doge meme with golden/tan fur, pointed ears, and the characteristic skeptical/surprised expression. Make it convincing and maintain the person's original emotion and composition."
    },
    "pepe": {
        "name": "Pepe",
        "description": "The internet's favorite green frog character",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/pepe_classic.jpg",
        "prompt": "Transform this person into the iconic 'Pepe the Frog' meme character. Maintain their pose and expression, but give them Pepe's green skin, large eyes, and red lips. Keep the same facial expression as the original photo but in Pepe style. Make it a high-quality, convincing transformation."
    },
    "btc_laser_eyes": {
        "name": "Laser Eyes",
        "description": "Add intense glowing laser eyes for a dramatic effect",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/laser_eyes_generic.jpg",
        "prompt": "Add glowing, intense red/orange laser eyes to this person's photo. The lasers should emerge dramatically from their eyes, creating an intense, powerful effect. Don't change anything else about the person or the background - just add the glowing laser eyes. Make it look realistic but stylized like a viral internet meme."
    },
    "voxel": {
        "name": "Voxel Art",
        "description": "Transform your photo into vibrant 3D voxel art",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/voxel_example.jpg",
        "prompt": "Transform this person's photo into a colorful, vibrant 3D voxel art style. Convert everything to a cube-based aesthetic with a limited color palette, resembling pixel art but in 3D. Maintain the person's recognizable features and pose. Make it look like something from a stylized voxel video game with clean, distinct cubes."
    },
    "anime": {
        "name": "Anime",
        "description": "Convert your photo into Japanese anime style",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/anime_example.jpg",
        "prompt": "Transform this person into a high-quality anime character in Japanese anime style. Give them large expressive eyes, simplified facial features, and stylized hair that matches their original color but in anime style. Maintain their original pose, clothing, and background, but convert everything to anime aesthetic. Make it look like a frame from a modern anime show."
    },
    "pixel_art": {
        "name": "Pixel Art",
        "description": "Transform your photo into retro pixel art style",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/pixel_art_example.jpg",
        "prompt": "Convert this person's photo into authentic pixel art style with a limited color palette. Make it look like it belongs in a retro video game from the 80s or 90s with clear pixel blocks. Keep the person recognizable by maintaining their key features, pose, and colors, but simplify everything into a grid of distinct pixels with no anti-aliasing or gradients."
    },
    "wojak": {
        "name": "Wojak",
        "description": "Transform into the iconic Wojak/Feels Guy meme",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/wojak_example.jpg",
        "prompt": "Transform this person into the 'Wojak' (also known as 'Feels Guy') meme character. Keep their pose and general expression, but give them the characteristic Wojak minimalist line art style with a bald head, simple facial features, and that distinct melancholic expression. Maintain their clothing and background but in the simplified Wojak style."
    },
    "cyberpunk": {
        "name": "Cyberpunk",
        "description": "Transform into a futuristic cyberpunk character",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/cyberpunk_example.jpg",
        "prompt": "Transform this person into a cyberpunk character with neon lights, cybernetic implants, and a futuristic dystopian aesthetic. Add glowing elements, tech lines, or subtle HUD elements around their features. Keep their pose and general appearance, but add cybernetic enhancements, modified clothing with tech elements, and a blue/purple/pink neon color scheme typical of the cyberpunk genre."
    },
}

# Initialize the template manager
TEMPLATES_KEY = "gemini_meme_templates"
USAGE_STATS_KEY = "gemini_usage_stats"
template_manager = TemplateManager(TEMPLATES_KEY, USAGE_STATS_KEY, DEFAULT_TEMPLATES)

router = APIRouter(prefix="/gemini-transform")



# Models for responses
class TransformResponse(BaseModel):
    success: bool
    message: str
    image_url: Optional[str] = None

# Initialize Gemini client
def get_gemini_client():
    """Initialize and return Gemini client"""
    api_key = db.secrets.get("GEMINI_API_KEY")
    if not api_key:
        api_key = db.secrets.get("SEGMIND_API_KEY")  # Fallback to try another key
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in secrets")
    
    # Configure the Gemini client
    genai.configure(api_key=api_key)
    return genai

# We now use template_manager.track_template_usage instead of this function





# Function to transform image using Gemini
async def transform_image_with_gemini(user_image_bytes, template_id: str):
    """Transform user image using Gemini API
    
    Args:
        user_image_bytes: Raw bytes of the user's uploaded image
        template_id: ID of the template to use for transformation
        
    Returns:
        Generated image as bytes
    """
    try:
        # Get the template-specific prompt
        prompt = template_manager.get_template_prompt(template_id)
        
        # Initialize Gemini client
        genai_client = get_gemini_client()
        
        # Convert image to base64 for the API
        base64_image = base64.b64encode(user_image_bytes).decode('utf-8')
        
        # Create Gemini model instance for image generation
        model = genai_client.GenerativeModel('gemini-2.0-flash-exp-image-generation')
        
        # Create the content to send to Gemini
        contents = (
            f"Using the following image as reference, {prompt}. " 
            f"Maintain the pose, general composition, and key elements of the original image while transforming it."
        )
        
        # Configure the generation to return both text and image
        # Use correct format for response modalities
        generation_config = {
            'response_modalities': ['Text', 'Image']
        }
        
        # Create the input structure with the reference image
        input_parts = [
            {"text": contents},
            {"inline_data": {"mime_type": "image/jpeg", "data": base64_image}}
        ]

        # Generate the content
        response = model.generate_content(
            contents=input_parts,
            generation_config=generation_config
        )
        
        # Process the response to extract the generated image
        result_image = None
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data is not None:
                # Extract the image data
                image_data = part.inline_data.data
                result_image = base64.b64decode(image_data)
                break
        
        if result_image is None:
            raise ValueError("No image was generated in the response")
        
        return result_image
    
    except Exception as e:
        print(f"Error transforming image with Gemini: {str(e)}")
        raise e

# API endpoint for image transformation
@router.post("/transform-with-gemini")
async def transform_image_with_gemini_api(
    user_image: UploadFile = File(...),
    template_id: str = Form(...)
):
    """Transform user image using specified template with Gemini API
    
    This endpoint takes a user's photo and transforms it using Gemini's image generation capabilities.
    It uses the template's prompt to guide the transformation, creating a meme-style image.
    
    Args:
        user_image: The user's photo to transform
        template_id: The ID of the meme template to use
        
    Returns:
        The transformed image as a PNG
        
    Raises:
        400: Invalid image or template
        404: Template not found
        500: Processing error
    """
    try:
        # Check file type
        content_type = user_image.content_type
        if not content_type or not content_type.startswith('image/'):
            template_manager.track_template_usage(template_id, False, "invalid_file_type")
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only images are accepted."
            )
        
        # Get user image bytes
        user_image_bytes = await user_image.read()
        if not user_image_bytes:
            template_manager.track_template_usage(template_id, False, "empty_file")
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Transform the image using Gemini
        try:
            result_bytes = await transform_image_with_gemini(user_image_bytes, template_id)
            
            # Track successful usage
            template_manager.track_template_usage(template_id, True)
            
            # Convert to base64 for response
            base64_result = base64.b64encode(result_bytes).decode('utf-8')
            data_url = f"data:image/png;base64,{base64_result}"
            
            return TransformResponse(
                success=True,
                message="Image transformed successfully",
                image_url=data_url
            )
        
        except ValueError as ve:
            # Handle specific errors
            error_message = str(ve)
            template_manager.track_template_usage(template_id, False, "value_error")
            raise HTTPException(status_code=400, detail=error_message)
        
        except Exception as e:
            # Handle general errors
            print(f"Error in image transformation: {str(e)}")
            template_manager.track_template_usage(template_id, False, "processing_error")
            raise HTTPException(
                status_code=500,
                detail="Failed to transform image. Please try again with a different photo."
            )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        template_manager.track_template_usage(template_id, False, "unexpected_error")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again later."
        )

@router.get("/gemini-templates")
def get_gemini_templates():
    """Get available meme templates for the frontend"""
    return template_manager.get_templates()