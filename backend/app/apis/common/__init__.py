import databutton as db
from typing import Dict, Any, Optional, List
import re
from datetime import datetime
import base64
import requests
import uuid

# Helper function for sanitizing storage keys
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# Constants for analytics
EVENTS_KEY_PREFIX = "events_"

# Analytics functions
def track_event(event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
    """Track custom events like page views, button clicks, etc.
    
    Args:
        event_type: Type of event (e.g., "page_view", "button_click")
        event_data: Additional data about the event
        
    Returns:
        Dictionary with success status
    """
    try:
        # Add timestamp and unique ID
        event_data["timestamp"] = datetime.now().isoformat()
        event_data["id"] = str(uuid.uuid4())
        event_data["type"] = event_type  # Include the type in the data
        
        # Get existing events or create new collection
        storage_key = sanitize_storage_key(f"{EVENTS_KEY_PREFIX}{event_type}")
        try:
            events = db.storage.json.get(storage_key)
        except FileNotFoundError:
            events = []
        
        # Add new event and limit to latest 1000 events to prevent unlimited growth
        events.append(event_data)
        events = events[-1000:]
        
        # Save updated events
        db.storage.json.put(storage_key, events)
        
        return {"success": True, "event_id": event_data["id"]}
    except Exception as e:
        print(f"Error tracking event: {str(e)}")
        return {"success": False, "error": str(e)}


def get_events(event_type: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Get events of a specific type
    
    Args:
        event_type: Type of events to retrieve
        limit: Maximum number of events to return
        
    Returns:
        List of events, most recent first
    """
    try:
        storage_key = sanitize_storage_key(f"{EVENTS_KEY_PREFIX}{event_type}")
        try:
            events = db.storage.json.get(storage_key)
            # Sort by timestamp descending and limit results
            events.sort(key=lambda e: e.get("timestamp", ""), reverse=True)
            return events[:limit]
        except FileNotFoundError:
            return []
    except Exception as e:
        print(f"Error retrieving events: {str(e)}")
        return []


def get_analytics_data(template_manager=None, custom_stats_key: Optional[str] = None) -> Dict[str, Any]:
    """Get comprehensive analytics data for admin dashboard
    
    Combines template usage statistics with event data to provide a complete picture
    of app usage.
    
    Args:
        template_manager: Optional TemplateManager instance to get template stats
        custom_stats_key: Optional custom stats key to use instead of the template manager's
        
    Returns:
        Dictionary with analytics data
    """
    try:
        # Initialize the analytics object
        analytics = {
            "total_transformations": 0,
            "total_uploads": 0,
            "total_downloads": 0,
            "total_shares": 0,
            "template_popularity": {},
            "conversion_rate": 0,
            "daily_activity": {},
            "methods": {},
            "templates": []
        }
        
        # Get template usage stats if template_manager is provided
        if template_manager:
            base_analytics = template_manager.get_analytics()
            analytics["templates"] = base_analytics.get("templates", [])
            
            # Try to get extended stats with method information
            try:
                stats_key = custom_stats_key or template_manager.usage_stats_key
                stats = db.storage.json.get(sanitize_storage_key(stats_key))
                
                # Add method information to the response
                methods_data = stats.get("methods", {})
                analytics["methods"] = methods_data
                
                # Add method breakdown to each template if available
                for template in analytics["templates"]:
                    template_id = template["id"]
                    if template_id in stats.get("templates", {}) and "methods" in stats["templates"][template_id]:
                        template["methods"] = stats["templates"][template_id]["methods"]
                
                # Extract overall stats
                for template_data in analytics["templates"]:
                    template_id = template_data["id"]
                    successes = template_data.get("count", 0)
                    analytics["total_transformations"] += successes
                    analytics["template_popularity"][template_id] = successes
            except FileNotFoundError:
                # If extended stats aren't available, continue with event-based analytics
                pass
        
        # Get event data for different event types
        page_views = get_events("page_view", 1000)
        transformations = get_events("transformation", 1000)
        downloads = get_events("download", 1000)
        shares = get_events("share", 1000)
        uploads = get_events("upload", 1000)
        
        # Count events
        analytics["total_uploads"] = len(uploads)
        if not analytics["total_transformations"]:
            analytics["total_transformations"] = len(transformations)
        analytics["total_downloads"] = len(downloads)
        analytics["total_shares"] = len(shares)
        
        # Calculate conversion rate
        if analytics["total_uploads"] > 0:
            analytics["conversion_rate"] = analytics["total_transformations"] / analytics["total_uploads"]
        
        # Process daily activity
        all_events = uploads + transformations + downloads + shares
        date_events = {}
        for event in all_events:
            timestamp = event.get("timestamp")
            if not timestamp:
                continue
                
            # Get just the date part (YYYY-MM-DD)
            date = timestamp.split("T")[0] if "T" in timestamp else timestamp.split(" ")[0]
            
            if date not in date_events:
                date_events[date] = {
                    "upload": 0,
                    "transformation_complete": 0,
                    "download": 0,
                    "share": 0
                }
            
            event_type = event.get("type")
            if event_type == "upload":
                date_events[date]["upload"] += 1
            elif event_type == "transformation":
                date_events[date]["transformation_complete"] += 1
            elif event_type == "download":
                date_events[date]["download"] += 1
            elif event_type == "share":
                date_events[date]["share"] += 1
        
        analytics["daily_activity"] = date_events
        
        return analytics
    except Exception as e:
        print(f"Error getting analytics data: {str(e)}")
        return {
            "error": str(e),
            "templates": [],
            "total_transformations": 0,
            "total_uploads": 0,
            "total_downloads": 0,
            "total_shares": 0,
            "template_popularity": {},
            "conversion_rate": 0,
            "daily_activity": {},
            "methods": {}
        }

class TemplateManager:
    """Centralized template management for all meme transformation APIs"""
    
    def __init__(self, templates_key: str, usage_stats_key: str, default_templates: Dict[str, Any]):
        """Initialize the template manager
        
        Args:
            templates_key: Storage key for templates
            usage_stats_key: Storage key for usage statistics
            default_templates: Default templates to use if none exist
        """
        self.templates_key = templates_key
        self.usage_stats_key = usage_stats_key
        self.default_templates = default_templates
    
    def initialize_templates(self) -> Dict[str, Any]:
        """Initialize templates for the first time or reset to defaults"""
        # Save templates to storage
        db.storage.json.put(sanitize_storage_key(self.templates_key), self.default_templates)
        print(f"Initialized {len(self.default_templates)} templates for {self.templates_key}")
        return self.default_templates
    
    def get_templates(self) -> Dict[str, Any]:
        """Get available templates"""
        try:
            templates = db.storage.json.get(sanitize_storage_key(self.templates_key))
            return templates
        except FileNotFoundError:
            # Initialize templates if they don't exist
            return self.initialize_templates()
    
    def get_template_prompt(self, template_id: str) -> str:
        """Get template prompt based on template_id"""
        templates = self.get_templates()
        if template_id not in templates:
            raise ValueError(f"Template '{template_id}' not found")
        
        template = templates[template_id]
        # Get the prompt from the template or use a default if not present
        if "prompt" in template:
            return template["prompt"]
        else:
            # Fallback to default prompt based on template name and description
            return f"Transform the user's photo into the style of {template['name']}. {template.get('description', '')}"
    
    def track_template_usage(self, template_id: str, success: bool = True, error_type: str = None):
        """Track template usage for analytics"""
        try:
            # Get current usage stats or initialize new ones
            try:
                stats = db.storage.json.get(sanitize_storage_key(self.usage_stats_key))
            except FileNotFoundError:
                stats = {
                    "templates": {}, 
                    "errors": {}, 
                    "total_requests": 0, 
                    "total_success": 0
                }
            
            # Update stats
            stats["total_requests"] = stats.get("total_requests", 0) + 1
            if success:
                stats["total_success"] = stats.get("total_success", 0) + 1
                
                # Update template stats
                if template_id not in stats["templates"]:
                    stats["templates"][template_id] = {"count": 0, "last_used": None}
                
                stats["templates"][template_id]["count"] = stats["templates"][template_id].get("count", 0) + 1
                stats["templates"][template_id]["last_used"] = datetime.now().isoformat()
            elif error_type:
                # Track errors
                if error_type not in stats["errors"]:
                    stats["errors"][error_type] = 0
                stats["errors"][error_type] = stats["errors"].get(error_type, 0) + 1
            
            # Save updated stats
            db.storage.json.put(sanitize_storage_key(self.usage_stats_key), stats)
        except Exception as e:
            # Don't let analytics errors disrupt the main functionality
            print(f"Error tracking template usage: {str(e)}")
    
    def get_analytics(self):
        """Get analytics data"""
        try:
            try:
                stats = db.storage.json.get(sanitize_storage_key(self.usage_stats_key))
            except FileNotFoundError:
                stats = {"templates": {}, "errors": {}, "total_requests": 0, "total_success": 0}
            
            # Get template names for better readability
            templates = self.get_templates()
            template_stats = []
            
            for template_id, data in stats.get("templates", {}).items():
                template_name = templates.get(template_id, {}).get("name", template_id) if template_id in templates else template_id
                template_stats.append({
                    "id": template_id,
                    "name": template_name,
                    "count": data.get("count", 0),
                    "last_used": data.get("last_used")
                })
            
            # Sort by usage count, descending
            template_stats.sort(key=lambda x: x["count"], reverse=True)
            
            return {
                "total_requests": stats.get("total_requests", 0),
                "total_success": stats.get("total_success", 0),
                "success_rate": f"{(stats.get('total_success', 0) / stats.get('total_requests', 1)) * 100:.1f}%" 
                    if stats.get("total_requests", 0) > 0 else "0%",
                "templates": template_stats,
                "errors": stats.get("errors", {})
            }
        except Exception as e:
            print(f"Error getting analytics data: {str(e)}")
            raise ValueError(f"Failed to retrieve analytics data: {str(e)}")