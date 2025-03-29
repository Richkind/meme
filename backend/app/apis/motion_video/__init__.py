from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import requests
import base64
import databutton as db
import os
import uuid
from typing import Optional
import json
import re

router = APIRouter()

# Function to sanitize storage keys
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# Model for input parameters
class MotionVideoRequest(BaseModel):
    image_url: str
    prompt: Optional[str] = None
    negative_prompt: Optional[str] = None
    video_length: Optional[int] = 24  # Default 1 second at 24fps
    seed: Optional[int] = None
    steps: Optional[int] = 25
    cfg: Optional[int] = 7
    frame_rate: Optional[int] = 24
    
# Model for response
class MotionVideoResponse(BaseModel):
    video_id: str
    status: str
    message: str

# Callback response model
class MotionVideoCallbackResponse(BaseModel):
    video_id: str
    status: str
    video_url: Optional[str] = None
    error: Optional[str] = None

# Function to fetch an image from a URL and convert it to base64
def image_url_to_base64(image_url):
    response = requests.get(image_url)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Failed to fetch image from URL: {image_url}")
    image_data = response.content
    return base64.b64encode(image_data).decode('utf-8')

# Background task to process the video
def process_motion_video(image_url: str, video_id: str, params: dict):
    try:
        # Get API key from secrets
        api_key = db.secrets.get("SEGMIND_API_KEY")
        if not api_key:
            raise Exception("SEGMIND_API_KEY not found in secrets")
            
        url = "https://api.segmind.com/v1/easy-animate"
        
        # Convert image to base64
        img_base64 = image_url_to_base64(image_url)
        
        # Prepare request data
        data = {
            "input_image": img_base64,
            "prompt": params.get("prompt", "high quality animation of an image"),
            "negative_prompt": params.get("negative_prompt", "low quality, blurry, distorted"),
            "video_length": params.get("video_length", 24),
            "seed": params.get("seed", 42),
            "steps": params.get("steps", 25),
            "cfg": params.get("cfg", 7),
            "frame_rate": params.get("frame_rate", 24)
        }
        
        headers = {'x-api-key': api_key}
        response = requests.post(url, json=data, headers=headers)
        
        result = {}
        if response.status_code == 200:
            # Save the video to storage
            video_data = response.content
            video_key = sanitize_storage_key(f"motion_videos/{video_id}.mp4")
            db.storage.binary.put(video_key, video_data)
            
            # Generate a URL for the video
            video_url = f"/api/motion-video/{video_id}/download"
            
            # Store the callback status
            result = {
                "video_id": video_id,
                "status": "completed",
                "video_url": video_url
            }
        else:
            # Handle error
            result = {
                "video_id": video_id,
                "status": "failed",
                "error": f"API Error: {response.status_code} - {response.text}"
            }
        
        # Save the result to storage
        status_key = sanitize_storage_key(f"motion_videos/{video_id}_status")
        db.storage.json.put(status_key, result)
        
    except Exception as e:
        # Handle exception
        error_result = {
            "video_id": video_id,
            "status": "failed",
            "error": str(e)
        }
        status_key = sanitize_storage_key(f"motion_videos/{video_id}_status")
        db.storage.json.put(status_key, error_result)

@router.post("/generate-motion-video")
async def generate_motion_video(request: MotionVideoRequest, background_tasks: BackgroundTasks) -> MotionVideoResponse:
    # Generate a unique ID for this request
    video_id = str(uuid.uuid4())
    
    # Store the request parameters
    params = {
        "prompt": request.prompt,
        "negative_prompt": request.negative_prompt,
        "video_length": request.video_length,
        "seed": request.seed,
        "steps": request.steps,
        "cfg": request.cfg,
        "frame_rate": request.frame_rate
    }
    
    # Initialize status
    status_data = {
        "video_id": video_id,
        "status": "processing"
    }
    
    # Save initial status
    status_key = sanitize_storage_key(f"motion_videos/{video_id}_status")
    db.storage.json.put(status_key, status_data)
    
    # Add the task to background
    background_tasks.add_task(process_motion_video, request.image_url, video_id, params)
    
    # Return immediate response
    return MotionVideoResponse(
        video_id=video_id,
        status="processing",
        message="Your motion video is being generated. Check status with the video ID."
    )

@router.get("/motion-video/{video_id}/status")
async def get_motion_video_status(video_id: str) -> MotionVideoCallbackResponse:
    try:
        # Get the status from storage
        status_key = sanitize_storage_key(f"motion_videos/{video_id}_status")
        status_data = db.storage.json.get(status_key)
        
        if not status_data:
            raise HTTPException(status_code=404, detail=f"No status found for video ID: {video_id}")
        
        return MotionVideoCallbackResponse(**status_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/motion-video/{video_id}/download")
async def download_motion_video(video_id: str):
    try:
        # Check if the video exists
        video_key = sanitize_storage_key(f"motion_videos/{video_id}.mp4")
        try:
            video_data = db.storage.binary.get(video_key)
        except:
            raise HTTPException(status_code=404, detail=f"Video not found for ID: {video_id}")
        
        # Return the video
        from fastapi.responses import Response
        return Response(content=video_data, media_type="video/mp4")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
