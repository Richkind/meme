import databutton as db
from typing import Dict, Any, Optional
import re
from datetime import datetime
import base64

# Helper function for sanitizing storage keys
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

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