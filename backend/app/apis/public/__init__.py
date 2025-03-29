from fastapi import APIRouter, Request, HTTPException
import databutton as db
from app.apis.common import sanitize_storage_key, TemplateManager

# Create a public router with no auth dependency
router = APIRouter()

# Get the main template manager from the common module
# We'll create a temporary manager with the same settings as faceswap's
TEMPLATES_KEY = "meme_templates"
USAGE_STATS_KEY = "faceswap_usage_stats"
DEFAULT_TEMPLATES = {} # Empty default since we're just reading existing templates
template_manager = TemplateManager(TEMPLATES_KEY, USAGE_STATS_KEY, DEFAULT_TEMPLATES)

# This endpoint is deprecated - use /faceswap/templates/public instead
@router.get("/public/faceswap/templates")
def get_templates_public():
    """Get available meme templates - publicly accessible endpoint
    
    Note: This endpoint is deprecated. Please use /faceswap/templates/public instead.
    """
    # Use the template manager to get templates
    return template_manager.get_templates()
