from typing import Optional, Dict, Any, List, Tuple, Union
import time
import base64
import io
from PIL import Image
import requests
from openai import OpenAI
import databutton as db
import re

# Create a router for the image_generation module
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/image-generation")

# Request model for image transformation
class ImageGenerationRequest(BaseModel):
    template_id: str
    image_data: str  # Base64 encoded image
    
# Response model for image transformation
class ImageGenerationResponse(BaseModel):
    transformed_image: str  # Base64 encoded image
    model_used: str

@router.post("/generate")
def generate_viral_meme(request: ImageGenerationRequest) -> ImageGenerationResponse:
    """Generate a viral meme from an uploaded image"""
    try:
        # Placeholder for now, we'll implement the full functionality later
        return ImageGenerationResponse(
            transformed_image=request.image_data,  # Just return the original image for now
            model_used="placeholder"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

# Reuse constants from the main OpenAI module
PRIMARY_MODEL = "gpt-4o"  # Main model (highest quality)
BACKUP_MODEL = "dall-e-3"   # Backup model for image generation
MODEL_USAGE_KEY = "openai_model_usage"

# Helper function to sanitize storage keys
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# Function to track model performance and usage - same as in __init__.py
def track_model_performance(model: str, processing_time: float, success: bool = True, error: str = None):
    """Track model performance for analytics"""
    import json
    from datetime import datetime
    
    try:
        # Get current stats or initialize new ones
        try:
            stats = db.storage.json.get(sanitize_storage_key(MODEL_USAGE_KEY))
        except FileNotFoundError:
            stats = {
                "models": {},
                "total_requests": 0,
                "total_success": 0,
                "errors": {}
            }
        
        # Update general stats
        stats["total_requests"] = stats.get("total_requests", 0) + 1
        if success:
            stats["total_success"] = stats.get("total_success", 0) + 1
        
        # Update model-specific stats
        if model not in stats["models"]:
            stats["models"][model] = {
                "count": 0,
                "success_count": 0,
                "total_time": 0,
                "last_used": None
            }
        
        model_stats = stats["models"][model]
        model_stats["count"] = model_stats.get("count", 0) + 1
        if success:
            model_stats["success_count"] = model_stats.get("success_count", 0) + 1
            model_stats["total_time"] = model_stats.get("total_time", 0) + processing_time
        model_stats["last_used"] = datetime.now().isoformat()
        
        # Track errors
        if not success and error:
            if error not in stats["errors"]:
                stats["errors"][error] = 0
            stats["errors"][error] = stats["errors"].get(error, 0) + 1
        
        # Save updated stats
        db.storage.json.put(sanitize_storage_key(MODEL_USAGE_KEY), stats)
    except Exception as e:
        # Don't let analytics errors disrupt the main functionality
        print(f"Error tracking model performance: {str(e)}")

# Initialize OpenAI client
def get_openai_client():
    """Get OpenAI client with API key"""
    api_key = db.secrets.get("OPENAI_API_KEY")
    return OpenAI(api_key=api_key)

# Image generation with GPT-4o Vision
async def generate_meme_image_with_gpt4o(client, user_image_bytes, template_id, character_name, style_description):
    """Generate a meme image using GPT-4o Vision
    
    Args:
        client: OpenAI client
        user_image_bytes: User's image as bytes
        template_id: The ID of the meme template
        character_name: Name of the character (e.g., "Pepe the Frog")
        style_description: Description of the character style
        
    Returns:
        Generated image bytes
    """
    try:
        # Convert image to base64 for API
        base64_image = base64.b64encode(user_image_bytes).decode('utf-8')
        
        # Start tracking processing time
        start_time = time.time()
        
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": f"You are an expert AI artist specializing in viral meme transformations. "
                               f"Your task is to transform the given photo into a {character_name} meme while "
                               f"preserving the person's pose, clothing, and composition. "
                               f"Style details: {style_description}"
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Transform this person into a {character_name} viral meme character. "
                                               f"Keep the same pose, clothing, and background. "
                                               f"Make it look like an authentic viral meme."},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }
            ],
            max_tokens=1000
        )
        
        # Extract the response
        generation_result = response.choices[0].message.content
        
        # Check if the result contains an image URL
        if "image.png" in generation_result or "https://" in generation_result:
            # Extract the URL using regex
            import re
            url_match = re.search(r'(https?://\S+)', generation_result)
            
            if url_match:
                image_url = url_match.group(0)
                # Remove any punctuation or markdown that might be part of the URL
                image_url = re.sub(r'[)\]\'"]$', '', image_url)
                
                # Download the image
                img_response = requests.get(image_url)
                if img_response.status_code == 200:
                    # Process successful - track performance
                    processing_time = time.time() - start_time
                    track_model_performance(PRIMARY_MODEL, processing_time, success=True)
                    
                    return img_response.content, PRIMARY_MODEL
        
        # If we couldn't find or process an image URL, fall back to DALL-E
        print(f"GPT-4o Vision couldn't generate a usable image. Falling back to {BACKUP_MODEL}")
        track_model_performance(PRIMARY_MODEL, time.time() - start_time, 
                               success=False, error="no_image_url_found")
        
        # Return None to indicate we need to fall back to DALL-E
        return None, None
        
    except Exception as e:
        # Log the error and track
        print(f"Error in GPT-4o Vision image generation: {str(e)}")
        track_model_performance(PRIMARY_MODEL, 0, success=False, error=str(e))
        
        # Return None to indicate fallback
        return None, None

# Image generation with DALL-E 3
async def generate_meme_image_with_dalle(client, user_image_bytes, template_id, character_name, style_description):
    """Generate a meme image using DALL-E 3 as a fallback
    
    Args:
        client: OpenAI client
        user_image_bytes: User's image as bytes
        template_id: The ID of the meme template
        character_name: Name of the character (e.g., "Pepe the Frog")
        style_description: Description of the character style
        
    Returns:
        Generated image bytes
    """
    try:
        # Convert user image to base64 for reference (we can't feed it directly to DALL-E)
        # But we will describe the image
        
        # Start tracking processing time
        start_time = time.time()
        
        # First, use GPT-4o to describe the image for DALL-E
        base64_image = base64.b64encode(user_image_bytes).decode('utf-8')
        
        description_response = client.chat.completions.create(
            model="gpt-4o",  # Using GPT-4o to describe the image
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that describes images in detail for image generation."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this person's appearance, pose, clothing, and background in detail. "
                                             "Focus only on visible elements that would be important for recreating the image."},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        image_description = description_response.choices[0].message.content
        
        # Now use DALL-E to generate the image based on the description
        prompt = (
            f"Create a {character_name} viral meme character with the following details: {image_description}. "
            f"Style: {style_description}. Make it look exactly like a viral meme, with the same pose and clothing as described."
        )
        
        dalle_response = client.images.generate(
            model=BACKUP_MODEL,
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        # Get the image URL
        image_url = dalle_response.data[0].url
        
        # Download the generated image
        img_response = requests.get(image_url)
        if img_response.status_code == 200:
            # Process successful - track performance
            processing_time = time.time() - start_time
            track_model_performance(BACKUP_MODEL, processing_time, success=True)
            
            return img_response.content, BACKUP_MODEL
        else:
            # Failed to download image
            print(f"Failed to download DALL-E image: {img_response.status_code}")
            track_model_performance(BACKUP_MODEL, time.time() - start_time, 
                                  success=False, error=f"download_failed_{img_response.status_code}")
            return None, None
        
    except Exception as e:
        # Log the error and track
        print(f"Error in DALL-E image generation: {str(e)}")
        track_model_performance(BACKUP_MODEL, 0, success=False, error=str(e))
        
        # Return None to indicate failure
        return None, None

# Main function with fallback mechanism
async def generate_viral_meme_image(user_image_bytes, template_id):
    """Generate a viral meme image with fallback between models
    
    Args:
        user_image_bytes: User's image as bytes
        template_id: The ID of the meme template
        
    Returns:
        Tuple of (generated image bytes, model used)
    """
    # Template-specific details for better results
    template_details = {
        "doge": {
            "name": "Doge",
            "description": "A Shiba Inu dog with a slightly tilted head. Golden fur with distinctive eyebrows."
        },
        "pepe": {
            "name": "Pepe the Frog",
            "description": "A green anthropomorphic frog with large eyes and red lips. Cartoon style with clean lines."
        },
        "anime": {
            "name": "Anime",
            "description": "An anime-style character with large expressive eyes, simplified facial features, and vibrant colors characteristic of Japanese animation."
        },
        "btc_laser_eyes": {
            "name": "Laser Eyes",
            "description": "A character with glowing red/orange laser eyes, popular in viral internet memes."
        },
        "voxel": {
            "name": "Voxel Art",
            "description": "A vibrant 3D voxel art style with cube-based aesthetics, creating a playful pixelated appearance similar to game art."
        }
    }
    
    # Get template details or use defaults
    details = template_details.get(template_id, {
        "name": "Viral meme character",
        "description": "A popular viral meme character with distinctive features."
    })
    
    client = get_openai_client()
    
    # First try with GPT-4o Vision (primary model)
    result_image, model_used = await generate_meme_image_with_gpt4o(
        client, 
        user_image_bytes, 
        template_id, 
        details["name"], 
        details["description"]
    )
    
    # If GPT-4o failed, try with DALL-E
    if result_image is None:
        result_image, model_used = await generate_meme_image_with_dalle(
            client, 
            user_image_bytes, 
            template_id, 
            details["name"], 
            details["description"]
        )
    
    # If both failed, raise an exception
    if result_image is None:
        raise ValueError("Failed to generate image with both primary and backup models")
    
    return result_image, model_used
