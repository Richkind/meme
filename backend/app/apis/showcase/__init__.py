import uuid
import re
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import random
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
import databutton as db

router = APIRouter(prefix="/showcase")

# Sanitize storage key to prevent invalid storage keys
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# Storage keys
SHOWCASE_KEY = "transformation_showcase"
MEME_TEMPLATES_KEY = "meme_templates"

# Data models
class ShowcaseItem(BaseModel):
    id: str = Field(..., description="Unique ID for the showcase item")
    timestamp: str = Field(..., description="ISO timestamp of when the transformation was created")
    template_id: str = Field(..., description="ID of the template used")
    template_name: str = Field(..., description="Name of the template used")
    template_description: str = Field(..., description="Description of the template")
    template_url: str = Field(..., description="URL to the original template image")
    result_url: str = Field(..., description="URL to the transformed image")
    likes: int = Field(default=0, description="Number of likes for this transformation")
    username: Optional[str] = Field(None, description="Username of the creator (if available)")
    caption: Optional[str] = Field(None, description="Optional caption for the transformation")

class ShowcaseResponse(BaseModel):
    items: List[ShowcaseItem] = Field(..., description="List of showcase items")
    total: int = Field(..., description="Total number of showcase items available")

class ClearShowcaseResponse(BaseModel):
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Message describing the result")

# Helper function to ensure we have showcase data
def ensure_showcase_data() -> List[dict]:
    """Ensure showcase data exists, creating sample data if needed"""
    try:
        showcase = db.storage.json.get(sanitize_storage_key(SHOWCASE_KEY))
        if not showcase or len(showcase) == 0:
            return create_sample_showcase()
        return showcase
    except FileNotFoundError:
        return create_sample_showcase()

# Create sample showcase data
def create_sample_showcase() -> List[dict]:
    """Create sample showcase data for demonstration"""
    # Get existing templates
    try:
        templates = db.storage.json.get(sanitize_storage_key(MEME_TEMPLATES_KEY))
    except FileNotFoundError:
        # If no templates exist, we can't create showcase items
        return []
    
    # Create a few sample showcase entries
    showcase_items = []
    available_templates = list(templates.keys())
    
    # Ensure viral meme templates are featured
    featured_templates = ["voxel", "doge", "pepe", "btc_laser_eyes", "anime"]
    # Add any remaining templates
    for template in available_templates:
        if template not in featured_templates:
            featured_templates.append(template)
    
    sample_captions = [
        "You're looking epic! 🔥",
        "When your meme goes viral",
        "When your post goes viral",
        "When you become a meme",
        "This is what peak performance looks like",
        "When you find out your favorite meme is trending",
        "Me explaining memes to my family during Thanksgiving",
        "Internet culture got me like",
        "When your viral post is up 300%",
        "Meme creators be like"
    ]
    
    # Create entries with timestamps spanning the last week
    for i in range(10):
        # Use voxel as the first item for prominence
        if i == 0:
            template_id = "voxel"
        else:
            template_id = featured_templates[i % len(featured_templates)]
            
        template = templates[template_id]
        
        # Create a timestamp within the last week
        days_ago = i * 0.7  # Spread them out over the last week
        timestamp = (datetime.now() - timedelta(days=days_ago)).isoformat()
        
        # Sample usernames
        usernames = ["meme_lord", "viral_king", "meme_enthusiast", "doge_lover", "pepe_fan"]
        
        showcase_items.append({
            "id": f"sample-{i+1}",
            "timestamp": timestamp,
            "template_id": template_id,
            "template_name": template["name"],
            "template_description": template["description"],
            "template_url": template["url"],
            "result_url": template["url"],  # In a real system, this would be transformed
            "likes": random.randint(5, 120),
            "username": random.choice(usernames),
            "caption": random.choice(sample_captions)
        })
    
    # Sort by timestamp, newest first
    showcase_items.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Save to storage
    db.storage.json.put(sanitize_storage_key(SHOWCASE_KEY), showcase_items)
    return showcase_items

@router.get("/", response_model=ShowcaseResponse)
async def get_showcase(limit: int = Query(10, description="Number of items to return", ge=1, le=50),
                      offset: int = Query(0, description="Offset for pagination", ge=0)):
    """Get public showcase of transformations"""
    try:
        # Ensure we have showcase data
        showcase_items = ensure_showcase_data()
        
        # Apply pagination
        paginated_items = showcase_items[offset:offset + limit]
        
        return ShowcaseResponse(
            items=paginated_items,
            total=len(showcase_items)
        )
    except Exception as e:
        print(f"Error getting showcase data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve showcase data")

@router.post("/like/{item_id}")
async def like_showcase_item(item_id: str):
    """Add a like to a showcase item"""
    try:
        showcase_items = ensure_showcase_data()
        
        # Find the item by ID
        for item in showcase_items:
            if item["id"] == item_id:
                # Increment likes
                item["likes"] = item.get("likes", 0) + 1
                
                # Save updated showcase
                db.storage.json.put(sanitize_storage_key(SHOWCASE_KEY), showcase_items)
                
                return {"success": True, "likes": item["likes"]}
        
        # If we get here, item wasn't found
        raise HTTPException(status_code=404, detail=f"Showcase item {item_id} not found")
    except Exception as e:
        print(f"Error liking showcase item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to like showcase item")

@router.post("/clear", response_model=ClearShowcaseResponse)
async def clear_showcase():
    """Clear all transformations from the showcase"""
    try:
        # Save an empty list to the showcase storage
        db.storage.json.put(sanitize_storage_key(SHOWCASE_KEY), [])
        return ClearShowcaseResponse(
            success=True,
            message="All showcase items have been removed successfully. New transformations will appear in the showcase as they are created."
        )
    except Exception as e:
        print(f"Error clearing showcase: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear showcase data")

# Function to add a real transformation to the showcase
def add_to_showcase(template_id: str, template_name: str, template_description: str, 
                    template_url: str, result_url: str, caption: Optional[str] = None,
                    username: Optional[str] = None) -> dict:
    """Add a real transformation to the showcase"""
    try:
        # Get existing showcase items
        try:
            showcase_items = db.storage.json.get(sanitize_storage_key(SHOWCASE_KEY))
        except FileNotFoundError:
            showcase_items = []
        
        # Create new showcase item
        new_item = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "template_id": template_id,
            "template_name": template_name,
            "template_description": template_description,
            "template_url": template_url,
            "result_url": result_url,
            "likes": 0,
            "username": username,
            "caption": caption
        }
        
        # Add to the beginning of the list (newest first)
        showcase_items.insert(0, new_item)
        
        # Keep only the most recent 100 items to avoid storage issues
        if len(showcase_items) > 100:
            showcase_items = showcase_items[:100]
        
        # Save updated showcase
        db.storage.json.put(sanitize_storage_key(SHOWCASE_KEY), showcase_items)
        
        return new_item
    except Exception as e:
        print(f"Error adding to showcase: {str(e)}")
        return None
