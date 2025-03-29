from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Literal, Union, Any
import databutton as db
from datetime import datetime
import uuid

# Import common analytics functions
from app.apis.common import track_event as track_event_internal
from app.apis.common import get_analytics_data as get_analytics_internal
from app.apis.common import get_events

router = APIRouter()

class TrackEventRequest(BaseModel):
    event_type: str
    template_id: Optional[str] = None
    session_id: str
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict)

class TrackEventResponse(BaseModel):
    success: bool
    event_id: str

class AnalyticsDataResponse(BaseModel):
    total_transformations: int
    total_uploads: int
    total_downloads: int
    total_shares: int
    template_popularity: Dict[str, int]
    conversion_rate: float
    daily_activity: Dict[str, Dict[str, int]]
    templates: Optional[List[Dict[str, Any]]] = None
    methods: Optional[Dict[str, Any]] = None

class AdminAuthResponse(BaseModel):
    success: bool
    message: str

# These functions are now handled by the common module

@router.post("/track")
def track_event(event_data: TrackEventRequest) -> TrackEventResponse:
    """Track a user interaction event"""
    try:
        # Use common track_event function
        result = track_event_internal(event_data.event_type, {
            "template_id": event_data.template_id,
            "session_id": event_data.session_id,
            **event_data.meta
        })
        
        return TrackEventResponse(success=result["success"], event_id=result.get("event_id", str(uuid.uuid4())))
    except Exception as e:
        print(f"Error tracking event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to track event: {str(e)}")

@router.get("/admin/auth")
def admin_auth(password: str = Query(...)) -> AdminAuthResponse:
    """Simple authentication for admin dashboard"""
    # In a real app, use a secure authentication system
    # This is a simple placeholder for demonstration purposes
    try:
        admin_password = db.secrets.get("ADMIN_PASSWORD")
        if not admin_password:
            # For security, refuse access if no password is set
            raise HTTPException(status_code=500, detail="Admin password not configured")
            
        if password == admin_password:
            return AdminAuthResponse(success=True, message="Authentication successful")
        else:
            return AdminAuthResponse(success=False, message="Invalid password")
    except Exception as e:
        print(f"Error in admin auth: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

@router.get("/admin/data")
def get_analytics_data(password: str = Query(...)) -> Dict[str, Any]:
    """Get aggregated analytics data for the admin dashboard"""
    # First authenticate
    auth_result = admin_auth(password)
    if not auth_result.success:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get template managers from different modules
        template_managers = []
        try:
            # Get meme generator template manager
            from app.apis.meme_generator import template_manager as meme_tm
            template_managers.append(meme_tm)
        except ImportError:
            print("Meme generator module not found")
            
        try:
            # Get gemini transform template manager
            from app.apis.gemini_transform import template_manager as gemini_tm
            template_managers.append(gemini_tm)
        except ImportError:
            print("Gemini transform module not found")
            
        try:
            # Get faceswap template manager (may be removed later)
            from app.apis.faceswap import template_manager as faceswap_tm
            template_managers.append(faceswap_tm)
        except ImportError:
            print("Faceswap module not found")
        
        # Get analytics from all template managers
        if not template_managers:
            # Fallback if no template managers found
            analytics = get_analytics_internal()
        else:
            # Start with the first template manager
            analytics = get_analytics_internal(template_managers[0])
            
            # Add data from other managers
            for tm in template_managers[1:]:
                extra_analytics = get_analytics_internal(tm)
                
                # Merge template popularity
                for template_id, count in extra_analytics.get("template_popularity", {}).items():
                    if template_id in analytics["template_popularity"]:
                        analytics["template_popularity"][template_id] += count
                    else:
                        analytics["template_popularity"][template_id] = count
                
                # Merge templates list
                analytics["templates"].extend(extra_analytics.get("templates", []))
                
                # Add to totals
                analytics["total_transformations"] += extra_analytics.get("total_transformations", 0)
        
        return analytics
    except Exception as e:
        print(f"Error getting analytics data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analytics data: {str(e)}")
