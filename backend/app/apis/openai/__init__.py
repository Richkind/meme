from fastapi import APIRouter, HTTPException, Body, Query
from pydantic import BaseModel
from typing import List, Optional, Union, Dict, Any, Tuple
import databutton as db
from openai import OpenAI
import json
import re  # For sanitizing storage keys
from datetime import datetime
import time
import base64  # For encoding images for vision API
import io  # For converting bytes to image objects
from PIL import Image  # For image processing

# Import extended prompts functionality is moved to avoid circular imports
from app.apis.extended_prompts import get_extended_prompt

# Import necessary libs for image generation
import requests

router = APIRouter(prefix="/openai")

# Constants for model configuration
PRIMARY_MODEL = "gpt-4o"  # Main model (highest quality)
BACKUP_MODEL = "gpt-4o-mini"  # Backup model (more reliable/cheaper)
VISION_MODEL = "gpt-4o"  # Vision model for image transformations
IMAGE_MODEL = "dall-e-3"  # Image generation model
MODEL_USAGE_KEY = "openai_model_usage"  # Key for tracking model usage

# Helper function to sanitize storage keys
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# Function to track model performance and usage
def track_model_performance(model: str, processing_time: float, success: bool = True, error: str = None):
    """Track model performance for analytics"""
    import json
    from datetime import datetime
    import re
    
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

# Function to generate text with fallback to backup model
async def generate_text_with_fallback(client, prompt) -> Tuple[str, List[str], str]:
    """Generate text using the primary model with fallback to backup model
    
    Returns:
        Tuple of (caption, alternatives, model_used)
    """
    # First try with the primary model (GPT-4o)
    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": "You are a hilarious viral meme generator. Your captions are short, witty, and perfect for viral memes. Keep captions under 140 characters. Include internet slang when appropriate."},
                {"role": "user", "content": prompt}
            ],
            n=3,  # Generate 3 alternatives
            max_tokens=150
        )
        
        # Extract the main caption and alternatives
        main_caption = response.choices[0].message.content.strip() if response.choices else ""
        
        # Get alternative captions
        alternatives = []
        for i in range(1, len(response.choices)):
            if i < len(response.choices):
                alt = response.choices[i].message.content.strip()
                if alt and alt != main_caption:
                    alternatives.append(alt)
        
        return main_caption, alternatives, PRIMARY_MODEL
    
    except Exception as primary_error:
        # Log the error with the primary model
        print(f"Primary model ({PRIMARY_MODEL}) error: {str(primary_error)}. Falling back to {BACKUP_MODEL}")
        track_model_performance(PRIMARY_MODEL, 0, success=False, error=str(primary_error))
        
        # Try with the backup model
        try:
            response = client.chat.completions.create(
                model=BACKUP_MODEL,
                messages=[
                    {"role": "system", "content": "You are a hilarious viral meme generator. Your captions are short, witty, and perfect for viral memes. Keep captions under 140 characters. Include internet slang when appropriate."},
                    {"role": "user", "content": prompt}
                ],
                n=3,  # Generate 3 alternatives
                max_tokens=150
            )
            
            # Extract the main caption and alternatives
            main_caption = response.choices[0].message.content.strip() if response.choices else ""
            
            # Get alternative captions
            alternatives = []
            for i in range(1, len(response.choices)):
                if i < len(response.choices):
                    alt = response.choices[i].message.content.strip()
                    if alt and alt != main_caption:
                        alternatives.append(alt)
            
            return main_caption, alternatives, BACKUP_MODEL
        
        except Exception as backup_error:
            # Both models failed, log and re-raise
            print(f"Backup model ({BACKUP_MODEL}) also failed: {str(backup_error)}")
            track_model_performance(BACKUP_MODEL, 0, success=False, error=str(backup_error))
            raise Exception(f"Both models failed. Primary error: {str(primary_error)}. Backup error: {str(backup_error)}")

# Initialize OpenAI client
def get_openai_client():
    """Get OpenAI client with API key"""
    api_key = db.secrets.get("OPENAI_API_KEY")
    return OpenAI(api_key=api_key)

# Function for transforming images with GPT-4o Vision
async def transform_image_with_gpt4_vision(client, user_image_bytes, template_id, custom_prompt=None):
    """Transform a user image into a viral meme character using GPT-4o Vision
    
    Args:
        client: OpenAI client instance
        user_image_bytes: The user's photo as bytes
        template_id: The meme template to use (e.g., 'pepe', 'wojak')
        custom_prompt: Optional custom instructions for the transformation
        
    Returns:
        Tuple of (image_bytes, transform_method)
    """
    try:
        # Track start time for model performance monitoring
        import time
        start_time = time.time()
        
        # Convert image bytes to base64 for API
        base64_image = base64.b64encode(user_image_bytes).decode('utf-8')
        
        # Template-specific prompts
        template_descriptions = {
            "doge": "the Doge meme character (Shiba Inu dog with the characteristic expression)",
            "pepe": "Pepe the Frog viral meme character (green frog with big eyes and wide red lips, with the classic Pepe style)",
            "anime": "an anime-style character with large expressive eyes, simplified facial features, and vibrant colors characteristic of Japanese animation",
            "btc_laser_eyes": "a person with glowing red/orange laser eyes (a popular viral meme style)",
            "voxel": "a vibrant 3D voxel art character with cube-based aesthetics, creating a playful pixelated appearance similar to game art"
        }
        
        # Get the appropriate description or use a default
        template_description = template_descriptions.get(
            template_id, 
            "a popular viral meme character"
        )
        
        # Step 1: Use GPT-4o Vision to analyze the image
        print("Step 1: Analyzing image with GPT-4o Vision...")
        
        # Get extended prompt for this specific template if available
        extended_prompt = get_extended_prompt(template_id)
        
        system_prompt = f"""You are an expert AI artist specializing in viral meme transformations."
        You are tasked with creating a perfect transformation of a person into {template_description}.
        Analyze this image and provide an extremely detailed artistic guide about how to transform this person's face 
        into the meme character while preserving their unique characteristics.
        
        Your analysis should cover:
        1. Facial structure: What specific features to modify to match the meme while keeping person's uniqueness
        2. Color palette: Exact colors to use for the transformation
        3. Expression details: How to modify the expression while maintaining recognizability
        4. Integration points: How to seamlessly blend the meme style with the person's features
        5. Style guidance: Specific stylistic elements to focus on
        
        SPECIFIC GUIDANCE FOR THIS CHARACTER: {extended_prompt}
        
        Make your description extremely detailed, specific, and actionable - as if directing another AI 
        to create this transformation perfectly."""
        
        # Add custom instructions if provided
        user_prompt = "Analyze this image and provide artistic guidance for transforming this person into the meme character."
        if custom_prompt:
            user_prompt += f" Additional requirements: {custom_prompt}"
        
        # Call GPT-4o Vision API for image analysis
        vision_response = client.chat.completions.create(
            model=VISION_MODEL,  # Using GPT-4o for vision analysis
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }
            ],
            max_tokens=1000,
            response_format={"type": "text"}
        )
        
        # Extract the detailed analysis
        artistic_guidance = vision_response.choices[0].message.content if vision_response.choices else ""
        
        # Check if we got a content policy refusal
        if "sorry" in artistic_guidance.lower() and ("can't" in artistic_guidance.lower() or "cannot" in artistic_guidance.lower()):
            print("Received potential content policy refusal from GPT-4o Vision")
            # Use a more neutral prompt that's less likely to be flagged
            artistic_guidance = f"Create a transformation of the person into {template_description}, maintaining key facial proportions but applying the characteristic stylistic elements of the meme character. Focus on making a seamless blend that looks authentic to the meme style while preserving the person's identity."
        
        print("Received artistic guidance from GPT-4o Vision")
        
        # Step 2: Generate the image transformation using the guidance
        print("Step 2: Generating transformed image...")
        
        # Create a detailed prompt for image generation
        prompt_for_image = f"""Create a photorealistic, high-quality transformation of a person into {template_description} based on this artistic guidance:
        
        {artistic_guidance}
        
        Make sure the result looks like an authentic meme while preserving the person's identity. The transformation should be seamless,
        high quality, and maintain the authentic style of the meme."""
        
        # Use the image generation model
        image_response = client.images.generate(
            model="dall-e-3",  # Using DALL-E 3 for high-quality image generation
            prompt=prompt_for_image,
            size="1024x1024",
            quality="standard",
            n=1
        )
        
        # Get the generated image URL
        image_url = image_response.data[0].url
        
        # Download the generated image
        import requests
        img_response = requests.get(image_url)
        if not img_response.ok:
            raise ValueError(f"Failed to download image from URL: {image_url}")
        
        transformed_image_bytes = img_response.content
        transform_method = "gpt4o_vision_guidance"
        
        # Calculate and log processing time
        processing_time = time.time() - start_time
        print(f"Image transformed in {processing_time:.2f} seconds using GPT-4o Vision guidance")
        
        # Track model usage and performance
        track_model_performance(VISION_MODEL, processing_time / 2, success=True)  # Approximate split
        track_model_performance("dall-e-3", processing_time / 2, success=True)  # Approximate split
        
        # Return with method information so it can be tracked
        return transformed_image_bytes, transform_method
    
    except Exception as e:
        print(f"Error transforming image: {str(e)}")
        track_model_performance(VISION_MODEL, 0, success=False, error=str(e))
        track_model_performance("dall-e-3", 0, success=False, error=str(e))
        raise

class MemeGenerationRequest(BaseModel):
    """Request model for generating meme text with GPT-4o"""
    template_id: str
    prompt: Optional[str] = None
    style: Optional[str] = "funny"
    context: Optional[Dict[str, Any]] = None

class MemeGenerationResponse(BaseModel):
    """Response model for meme text generation"""
    caption: str
    alternative_captions: List[str] = []
    model_used: str = "gpt-4o"

@router.get("/model-analytics")
async def get_model_analytics(password: str = Query(...)):
    """Get analytics data for AI model usage
    
    This endpoint returns usage statistics for the different OpenAI models.    
    """
    # Authenticate admin using the same method as analytics API
    try:
        admin_password = db.secrets.get("ADMIN_PASSWORD")
        if not admin_password:
            # For security, refuse access if no password is set
            raise HTTPException(status_code=500, detail="Admin password not configured")
                
        if password != admin_password:
            raise HTTPException(status_code=401, detail="Invalid password")
    except Exception as e:
        print(f"Error in admin auth: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")
    
    try:
        # Get current model usage stats
        try:
            stats = db.storage.json.get(sanitize_storage_key(MODEL_USAGE_KEY))
        except FileNotFoundError:
            stats = {
                "models": {},
                "total_requests": 0,
                "total_success": 0,
                "errors": {}
            }
        
        # Calculate some additional metrics
        model_stats = []
        for model_id, data in stats.get("models", {}).items():
            # Calculate average processing time
            avg_time = 0
            if data.get("success_count", 0) > 0 and data.get("total_time", 0) > 0:
                avg_time = data.get("total_time", 0) / data.get("success_count", 0)
            
            # Calculate success rate
            success_rate = 0
            if data.get("count", 0) > 0:
                success_rate = (data.get("success_count", 0) / data.get("count", 0)) * 100
            
            model_stats.append({
                "id": model_id,
                "count": data.get("count", 0),
                "success_count": data.get("success_count", 0),
                "success_rate": f"{success_rate:.1f}%",
                "avg_processing_time": f"{avg_time:.2f}s",
                "last_used": data.get("last_used")
            })
        
        # Sort by usage count, descending
        model_stats.sort(key=lambda x: x["count"], reverse=True)
        
        # Format errors for display
        errors = []
        for error_type, count in stats.get("errors", {}).items():
            errors.append({
                "type": error_type,
                "count": count
            })
        
        # Sort errors by count
        errors.sort(key=lambda x: x["count"], reverse=True)
        
        return {
            "total_requests": stats.get("total_requests", 0),
            "total_success": stats.get("total_success", 0),
            "success_rate": f"{(stats.get('total_success', 0) / stats.get('total_requests', 1)) * 100:.1f}%" 
                if stats.get("total_requests", 0) > 0 else "0%",
            "models": model_stats,
            "errors": errors,
            "primary_model": PRIMARY_MODEL,
            "backup_model": BACKUP_MODEL
        }
    except Exception as e:
        print(f"Error getting model analytics data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve model analytics data")

# Function for generating viral meme images
async def generate_viral_meme_image(user_image_bytes, template_id):
    """Generate a viral meme image using OpenAI
    
    Args:
        user_image_bytes: User's image as bytes
        template_id: The ID of the meme template
        
    Returns:
        Tuple of (generated image bytes, model used)
    """
    # For now, we'll just use the GPT-4o Vision approach which is already implemented
    client = get_openai_client()
    
    # Use GPT-4o Vision for transformation
    return await transform_image_with_gpt4_vision(
        client, 
        user_image_bytes, 
        template_id, 
        None  # No custom prompt
    )

@router.post("/generate-meme-text", operation_id="generate_meme_text")
async def generate_meme_text(request: MemeGenerationRequest) -> MemeGenerationResponse:
    """Generate meme text/captions using GPT-4o
    
    This endpoint uses OpenAI's GPT-4o to generate creative and funny meme captions
    based on the selected template and optional context.
    
    Args:
        request: The meme generation request containing template and context
        
    Returns:
        Meme caption text and alternatives
    """
    try:
        client = get_openai_client()
        
        # Track start time for model performance monitoring
        import time
        start_time = time.time()
        
        # Template-specific prompting
        template_prompts = {
            "doge": "Create a funny Doge meme caption (using Doge speak like 'much wow, very meme') about",
            "pepe": "Create a funny Pepe the Frog viral meme caption about",
            "anime": "Create a funny anime-style viral meme caption (with references to anime tropes) about",
            "btc_laser_eyes": "Create a funny laser eyes meme caption (celebrating internet meme culture) about",
            "voxel": "Create a funny voxel art style viral meme caption about"
        }
        
        # Default prompt for unknown templates
        base_prompt = template_prompts.get(
            request.template_id, 
            "Create a funny viral meme caption about"
        )
        
        # User's custom prompt or default to market conditions
        topic = request.prompt or "current internet trends, viral memes, or popular culture"
        
        # Build the final prompt
        full_prompt = f"{base_prompt} {topic}. Make it {request.style}, witty and internet-related."
        
        # Add context if provided
        if request.context:
            context_str = json.dumps(request.context)
            full_prompt += f"\n\nUse this additional context: {context_str}"
        
        # Call OpenAI API with fallback logic
        caption, alternatives, model_used = await generate_text_with_fallback(client, full_prompt)
        
        # Calculate and log processing time
        processing_time = time.time() - start_time
        print(f"Caption generated using model {model_used} in {processing_time:.2f} seconds")
        
        # Track model usage and performance
        track_model_performance(model_used, processing_time, success=True)
        
        return MemeGenerationResponse(
            caption=caption,
            alternative_captions=alternatives,
            model_used=model_used
        )
    except Exception as e:
        print(f"Error generating meme text: {str(e)}")
        # Try to track the failure
        try:
            track_model_performance("unknown", 0, success=False, error=str(e))
        except:
            pass  # Don't let tracking errors disrupt the main error handling
        raise HTTPException(status_code=500, detail=f"Failed to generate meme text: {str(e)}")
