import databutton as db
import re
from typing import Dict, Any

# Storage key for meme templates
TEMPLATES_KEY = "gemini_meme_templates"

# Helper function for sanitizing storage keys
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# Define available meme templates with Gemini-specific prompts
DEFAULT_TEMPLATES = {
    "doge": {
        "name": "Doge",
        "description": "The iconic Shiba Inu meme that became a global sensation",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/doge_classic.jpg",
        "prompt": "Transform this person into the iconic 'Doge' Shiba Inu meme. Keep their pose and expression, but make them look like the famous Doge meme with golden/tan fur, pointed ears, and the characteristic skeptical/surprised expression. Make it convincing and maintain the person's original emotion and composition."
    },
    "pepe": {
        "name": "Pepe",
        "description": "The internet's favorite green frog character",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/pepe_classic.jpg",
        "prompt": "Transform this person into the iconic 'Pepe the Frog' meme character. Maintain their pose and expression, but give them Pepe's green skin, large eyes, and red lips. Keep the same facial expression as the original photo but in Pepe style. Make it a high-quality, convincing transformation."
    },
    "btc_laser_eyes": {
        "name": "Laser Eyes",
        "description": "Add intense glowing laser eyes for a dramatic effect",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/laser_eyes_generic.jpg",
        "prompt": "Add glowing, intense red/orange laser eyes to this person's photo. The lasers should emerge dramatically from their eyes, creating an intense, powerful effect. Don't change anything else about the person or the background - just add the glowing laser eyes. Make it look realistic but stylized like a viral internet meme."
    },
    "voxel": {
        "name": "Voxel Art",
        "description": "Transform your photo into vibrant 3D voxel art",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/voxel_example.jpg",
        "prompt": "Transform this person's photo into a colorful, vibrant 3D voxel art style. Convert everything to a cube-based aesthetic with a limited color palette, resembling pixel art but in 3D. Maintain the person's recognizable features and pose. Make it look like something from a stylized voxel video game with clean, distinct cubes."
    },
    "anime": {
        "name": "Anime",
        "description": "Convert your photo into Japanese anime style",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/anime_example.jpg",
        "prompt": "Transform this person into a high-quality anime character in Japanese anime style. Give them large expressive eyes, simplified facial features, and stylized hair that matches their original color but in anime style. Maintain their original pose, clothing, and background, but convert everything to anime aesthetic. Make it look like a frame from a modern anime show."
    },
    "pixel_art": {
        "name": "Pixel Art",
        "description": "Transform your photo into retro pixel art style",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/pixel_art_example.jpg",
        "prompt": "Convert this person's photo into authentic pixel art style with a limited color palette. Make it look like it belongs in a retro video game from the 80s or 90s with clear pixel blocks. Keep the person recognizable by maintaining their key features, pose, and colors, but simplify everything into a grid of distinct pixels with no anti-aliasing or gradients."
    },
    "wojak": {
        "name": "Wojak",
        "description": "Transform into the iconic Wojak/Feels Guy meme",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/wojak_example.jpg",
        "prompt": "Transform this person into the 'Wojak' (also known as 'Feels Guy') meme character. Keep their pose and general expression, but give them the characteristic Wojak minimalist line art style with a bald head, simple facial features, and that distinct melancholic expression. Maintain their clothing and background but in the simplified Wojak style."
    },
    "cyberpunk": {
        "name": "Cyberpunk",
        "description": "Transform into a futuristic cyberpunk character",
        "url": "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/cyberpunk_example.jpg",
        "prompt": "Transform this person into a cyberpunk character with neon lights, cybernetic implants, and a futuristic dystopian aesthetic. Add glowing elements, tech lines, or subtle HUD elements around their features. Keep their pose and general appearance, but add cybernetic enhancements, modified clothing with tech elements, and a blue/purple/pink neon color scheme typical of the cyberpunk genre."
    },
}

def initialize_templates() -> Dict[str, Any]:
    """Initialize templates for the first time or reset to defaults"""
    # Save templates to storage
    db.storage.json.put(sanitize_storage_key(TEMPLATES_KEY), DEFAULT_TEMPLATES)
    print(f"Initialized {len(DEFAULT_TEMPLATES)} meme templates")
    return DEFAULT_TEMPLATES

def get_templates() -> Dict[str, Any]:
    """Get available meme templates"""
    try:
        templates = db.storage.json.get(sanitize_storage_key(TEMPLATES_KEY))
        return templates
    except FileNotFoundError:
        # Initialize templates if they don't exist
        return initialize_templates()

def get_template_prompt(template_id: str) -> str:
    """Get template prompt based on template_id"""
    templates = get_templates()
    if template_id not in templates:
        raise ValueError(f"Template '{template_id}' not found")

    template = templates[template_id]
    # Get the prompt from the template or use a default if not present
    if "prompt" in template:
        return template["prompt"]
    else:
        # Fallback to default prompt based on template name and description
        return f"Transform the user's photo into the style of {template['name']}. {template.get('description', '')}"
