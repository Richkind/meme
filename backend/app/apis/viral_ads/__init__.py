from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import databutton as db
import json
import random
import time
from datetime import datetime

router = APIRouter(prefix="/viral-ads")

# Ad categories and their descriptions
AD_CATEGORIES = {
    "meme": "Humorous viral meme images and satirical content",
    "promo": "Professional promotional material for brands",
    "educational": "Educational content explaining various concepts",
    "announcement": "New feature or product announcements",
    "trend": "Current trend-related content"
}

class AdGenerationRequest(BaseModel):
    prompt: str
    category: str
    style_keywords: Optional[List[str]] = None

class AdGenerationResponse(BaseModel):
    image_url: str
    prompt_used: str
    category: str
    generation_id: str

@router.get("/categories")
def get_ad_categories():
    """
    Get available ad categories
    """
    return AD_CATEGORIES

@router.post("/generate", response_model=AdGenerationResponse)
def generate_ad(request: AdGenerationRequest):
    """
    Generate a viral advertisement based on the provided prompt and category
    """
    # Validate category
    if request.category not in AD_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Available categories: {list(AD_CATEGORIES.keys())}")
    
    # Track usage for analytics
    try:
        usage_data = db.storage.json.get("viral_ad_generation_usage", default={"count": 0, "by_category": {}})
        usage_data["count"] += 1
        usage_data["by_category"][request.category] = usage_data["by_category"].get(request.category, 0) + 1
        usage_data["last_used"] = datetime.now().isoformat()
        db.storage.json.put("viral_ad_generation_usage", usage_data)
    except Exception as e:
        print(f"Error tracking usage: {str(e)}")
    
    # Generate a unique ID for this generation
    generation_id = f"ad-{int(time.time())}-{random.randint(1000, 9999)}"
    
    # This is a placeholder for actual image generation
    # In a real implementation, this would call an AI image generation model
    placeholder_images = {
        "meme": "https://viral-memes.s3.amazonaws.com/viral-meme-1.jpg",
        "promo": "https://viral-memes.s3.amazonaws.com/viral-promo-1.jpg",
        "educational": "https://viral-memes.s3.amazonaws.com/viral-educational-1.jpg",
        "announcement": "https://viral-memes.s3.amazonaws.com/viral-announcement-1.jpg",
        "trend": "https://viral-memes.s3.amazonaws.com/viral-trend-1.jpg"
    }
    
    # Enhanced prompt based on category
    category_prompts = {
        "meme": "Create a humorous viral meme image with ",
        "promo": "Design a professional promotional advertisement for ",
        "educational": "Generate an educational infographic about ",
        "announcement": "Create an announcement banner for ",
        "trend": "Design a trending visual graphic for "
    }
    
    # Combine the base prompt with style keywords if provided
    enhanced_prompt = category_prompts.get(request.category, "") + request.prompt
    if request.style_keywords:
        enhanced_prompt += f" with {', '.join(request.style_keywords)} style"
    
    # Store the request and generated prompt for future reference
    try:
        generation_history = db.storage.json.get("viral_ad_generation_history", default=[])
        generation_history.append({
            "id": generation_id,
            "timestamp": datetime.now().isoformat(),
            "original_prompt": request.prompt,
            "enhanced_prompt": enhanced_prompt,
            "category": request.category,
            "style_keywords": request.style_keywords
        })
        db.storage.json.put("viral_ad_generation_history", generation_history[-100:])  # Keep only last 100 entries
    except Exception as e:
        print(f"Error storing generation history: {str(e)}")
    
    # Return placeholder response for now
    return AdGenerationResponse(
        image_url=placeholder_images.get(request.category, placeholder_images["meme"]),
        prompt_used=enhanced_prompt,
        category=request.category,
        generation_id=generation_id
    )