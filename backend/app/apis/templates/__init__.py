from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Request, Response
from pydantic import BaseModel
import databutton as db
from typing import Dict, List, Optional
import base64
from datetime import datetime
import re
import requests
import json

router = APIRouter(prefix="/templates")

# Storage keys
TEMPLATES_KEY = "meme_templates"

# Helper function for sanitizing storage keys
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# Models for requests and responses
class AdminAuthRequest(BaseModel):
    password: str

class TemplateAddRequest(BaseModel):
    name: str
    description: str
    url: str
    template_id: Optional[str] = None
    prompt: Optional[str] = None

class TemplateUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    prompt: Optional[str] = None

class TemplateListResponse(BaseModel):
    templates: Dict[str, Dict]

class TemplateResponse(BaseModel):
    success: bool
    message: str
    template_id: Optional[str] = None
    template: Optional[Dict] = None

# Authentication helper
def verify_admin(password: str) -> bool:
    """Verify admin password"""
    try:
        admin_password = db.secrets.get("ADMIN_PASSWORD")
        if not admin_password:
            # For security, refuse access if no password is set
            return False
            
        return password == admin_password
    except Exception as e:
        print(f"Error in admin auth: {str(e)}")
        return False

# API Endpoints
@router.get("/list")
def list_templates(password: str = Query(...)):
    """List all templates in the system"""
    if not verify_admin(password):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get templates from storage
        try:
            templates = db.storage.json.get(sanitize_storage_key(TEMPLATES_KEY))
        except FileNotFoundError:
            # Return empty dict if no templates exist
            templates = {}
        
        return TemplateListResponse(templates=templates)
    except Exception as e:
        print(f"Error listing templates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list templates: {str(e)}")

@router.post("/add")
async def add_template(name: str = Form(...), 
                     description: str = Form(...),
                     image: UploadFile = File(...),
                     template_id: Optional[str] = Form(None),
                     prompt: Optional[str] = Form(None),
                     password: str = Form(...)):
    """Add a new template to the system"""
    if not verify_admin(password):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Read image file
        image_bytes = await image.read()
        
        # Check file type
        content_type = image.content_type
        if not content_type or not content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Only images are accepted.")
        
        # Generate template ID if not provided
        if not template_id:
            # Create slug from name: lowercase, replace spaces with underscores
            template_id = name.lower().replace(' ', '_')
            # Remove special characters
            template_id = re.sub(r'[^a-z0-9_]', '', template_id)
        
        # Get existing templates
        try:
            templates = db.storage.json.get(sanitize_storage_key(TEMPLATES_KEY))
        except FileNotFoundError:
            templates = {}
        
        # Check if template ID already exists
        if template_id in templates:
            raise HTTPException(status_code=400, detail=f"Template ID '{template_id}' already exists")
        
        # Upload image to databutton static storage
        # For this demo, we'll store the image data directly in binary storage
        template_image_key = sanitize_storage_key(f"template_{template_id}_image")
        db.storage.binary.put(template_image_key, image_bytes)
        
        # Create image URL using data URL for demonstration
        # In a production app, you might use a CDN or other storage service
        image_extension = image.filename.split('.')[-1] if '.' in image.filename else 'png'
        image_data_url = f"data:image/{image_extension};base64,{base64.b64encode(image_bytes).decode('utf-8')}"
        
        # Create new template
        template = {
            "name": name,
            "description": description,
            "url": image_data_url,
            "created_at": datetime.now().isoformat()
        }
        
        # Add prompt if provided
        if prompt:
            template["prompt"] = prompt
        
        # Add to templates dictionary
        templates[template_id] = template
        
        # Save templates
        db.storage.json.put(sanitize_storage_key(TEMPLATES_KEY), templates)
        
        return TemplateResponse(
            success=True,
            message=f"Template '{name}' added successfully",
            template_id=template_id,
            template=template
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add template: {str(e)}")

@router.put("/update/{template_id}")
async def update_template(template_id: str,
                       name: Optional[str] = Form(None),
                       description: Optional[str] = Form(None),
                       image: Optional[UploadFile] = File(None),
                       prompt: Optional[str] = Form(None),
                       password: str = Form(...)):
    """Update an existing template"""
    if not verify_admin(password):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get existing templates
        try:
            templates = db.storage.json.get(sanitize_storage_key(TEMPLATES_KEY))
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="No templates found")
        
        # Check if template exists
        if template_id not in templates:
            raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
        
        template = templates[template_id]
        
        # Update template fields if provided
        if name:
            template["name"] = name
        
        if description:
            template["description"] = description
        
        if prompt:
            template["prompt"] = prompt
        elif prompt == "":
            # Remove prompt if empty string
            template.pop("prompt", None)
        
        # Process new image if provided
        if image:
            image_bytes = await image.read()
            
            # Check file type
            content_type = image.content_type
            if not content_type or not content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="Invalid file type. Only images are accepted.")
            
            # Update image in storage
            template_image_key = sanitize_storage_key(f"template_{template_id}_image")
            db.storage.binary.put(template_image_key, image_bytes)
            
            # Create image URL using data URL for demonstration
            image_extension = image.filename.split('.')[-1] if '.' in image.filename else 'png'
            image_data_url = f"data:image/{image_extension};base64,{base64.b64encode(image_bytes).decode('utf-8')}"
            
            # Update template URL
            template["url"] = image_data_url
        
        # Update modified timestamp
        template["updated_at"] = datetime.now().isoformat()
        
        # Save templates
        db.storage.json.put(sanitize_storage_key(TEMPLATES_KEY), templates)
        
        return TemplateResponse(
            success=True,
            message=f"Template '{template_id}' updated successfully",
            template_id=template_id,
            template=template
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update template: {str(e)}")

@router.delete("/delete/{template_id}")
def delete_template(template_id: str, password: str = Query(...)):
    """Delete a template"""
    if not verify_admin(password):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get existing templates
        try:
            templates = db.storage.json.get(sanitize_storage_key(TEMPLATES_KEY))
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="No templates found")
        
        # Check if template exists
        if template_id not in templates:
            raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
        
        # Remove template from dictionary
        deleted_template = templates.pop(template_id)
        
        # Save updated templates
        db.storage.json.put(sanitize_storage_key(TEMPLATES_KEY), templates)
        
        # Try to delete template image
        try:
            template_image_key = sanitize_storage_key(f"template_{template_id}_image")
            # Note: db.storage.binary.delete doesn't exist in the current SDK, so this will fail
            # This is just a placeholder for actual implementation
            # In a real app, you would use the appropriate method to delete files
            try:
                db.storage.binary.delete(template_image_key)
            except AttributeError:
                # If delete method doesn't exist, just print a warning
                print(f"Warning: Unable to delete template image file. Method not available.")
        except Exception as e:
            print(f"Error deleting template image: {str(e)}")
            # Continue even if image deletion fails
        
        return TemplateResponse(
            success=True,
            message=f"Template '{template_id}' deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete template: {str(e)}")
