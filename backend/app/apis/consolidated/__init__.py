from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Literal, Union, Any
import databutton as db
from datetime import datetime
import json
import uuid

# Import common functions
from app.apis.common import sanitize_storage_key, TemplateManager
from app.apis.common import track_event as track_event_internal
from app.apis.common import get_analytics_data as get_analytics_internal

router = APIRouter()

# Models for analytics API
class TrackEventRequest(BaseModel):
    event_type: str
    template_id: Optional[str] = None
    session_id: str
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict)

class TrackEventResponse(BaseModel):
    success: bool
    event_id: Optional[str] = None
    error: Optional[str] = None

class AdminAuthRequest(BaseModel):
    password: str

class AdminAuthResponse(BaseModel):
    success: bool
    message: str

# Helper function for authentication
def admin_auth_check(password: str = Query(...)) -> bool:
    """Check if admin password is valid"""
    admin_password = db.secrets.get("ADMIN_PASSWORD")
    if not admin_password:
        # For security, refuse access if no password is set
        raise HTTPException(status_code=500, detail="Admin password not configured")
        
    if password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    
    return True

# Authentication endpoint
@router.post("/auth", operation_id="admin_auth")
def admin_auth(auth_data: AdminAuthRequest) -> AdminAuthResponse:
    """Authenticate admin user
    
    This endpoint validates the admin password.
    """
    try:
        admin_password = db.secrets.get("ADMIN_PASSWORD")
        if not admin_password:
            # For security, refuse access if no password is set
            return AdminAuthResponse(success=False, message="Admin password not configured")
            
        if auth_data.password == admin_password:
            return AdminAuthResponse(success=True, message="Authentication successful")
        else:
            return AdminAuthResponse(success=False, message="Invalid password")
    except Exception as e:
        print(f"Error in admin auth: {str(e)}")
        return AdminAuthResponse(success=False, message=f"Authentication error: {str(e)}")

# Event tracking endpoint
@router.post("/track_event", operation_id="track_event")
async def track_event(event_data: TrackEventRequest) -> TrackEventResponse:
    """Track custom events
    
    This endpoint allows tracking custom events like page views or button clicks.
    """
    try:
        # Use common analytics module to track event
        result = track_event_internal(event_data.event_type, {
            "template_id": event_data.template_id,
            "session_id": event_data.session_id,
            **event_data.meta
        })
        
        if result.get("success", False):
            return TrackEventResponse(
                success=True,
                event_id=result.get("event_id", str(uuid.uuid4()))
            )
        else:
            return TrackEventResponse(
                success=False,
                error=result.get("error", "Unknown error")
            )
    except Exception as e:
        print(f"Error tracking event: {str(e)}")
        return TrackEventResponse(success=False, error=str(e))

# Get analytics endpoint
@router.get("/data", operation_id="get_analytics_data")
async def get_analytics_data(password: str = Query(...)) -> Dict[str, Any]:
    """Get analytics data for admin dashboard
    
    This endpoint returns usage statistics for all template transformations,
    user activity metrics, and template popularity.
    """
    # Authenticate admin user
    admin_auth_check(password)
    
    try:
        # Get template managers for all modules
        from app.apis.meme_generator import template_manager as meme_tm
        from app.apis.gemini_transform import template_manager as gemini_tm
        
        # Try to import faceswap template manager - may be removed later
        faceswap_tm = None
        try:
            from app.apis.faceswap import template_manager as faceswap_tm
        except ImportError:
            print("Faceswap module not found, skipping its analytics")
        
        # Get analytics from all template managers
        consolidated_analytics = get_analytics_internal(meme_tm)
        
        # Add data from gemini transform
        gemini_analytics = get_analytics_internal(gemini_tm)
        for template_id, count in gemini_analytics.get("template_popularity", {}).items():
            if template_id in consolidated_analytics["template_popularity"]:
                consolidated_analytics["template_popularity"][template_id] += count
            else:
                consolidated_analytics["template_popularity"][template_id] = count
        
        consolidated_analytics["total_transformations"] += gemini_analytics.get("total_transformations", 0)
        
        # Add data from faceswap if available
        if faceswap_tm:
            faceswap_analytics = get_analytics_internal(faceswap_tm)
            for template_id, count in faceswap_analytics.get("template_popularity", {}).items():
                if template_id in consolidated_analytics["template_popularity"]:
                    consolidated_analytics["template_popularity"][template_id] += count
                else:
                    consolidated_analytics["template_popularity"][template_id] = count
            
            consolidated_analytics["total_transformations"] += faceswap_analytics.get("total_transformations", 0)
        
        return consolidated_analytics
    except Exception as e:
        print(f"Error getting analytics data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analytics data: {str(e)}")
