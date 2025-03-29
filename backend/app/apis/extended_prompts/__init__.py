from fastapi import APIRouter

# Create a router for the extended_prompts module
router = APIRouter(prefix="/extended-prompts")

import databutton as db
import json
import re

# Dictionary to store the extended prompts loaded from storage
_extended_prompts_cache = None

# Key for the storage file
EXTENDED_PROMPTS_KEY = "extended_meme_prompts"

# Helper function to sanitize storage keys
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def initialize_extended_prompts():
    """Initialize extended prompts with default values"""
    default_prompts = {
        "wojak": "Create a Wojak transformation with the characteristic simple line drawing style. "
                "Keep the blank, slightly depressed expression but incorporate the subject's "
                "unique facial structure. Use minimal details, focusing on the outline. "
                "The color palette should be grayscale with very pale skin tone. "
                "The facial features should be simplified but still recognizable as the person.",

        "doge": "Transform the subject into the iconic Doge Shiba Inu meme. "
               "Maintain the characteristic head tilt and suspicious/surprised expression of Doge. "
               "Use the golden/tan fur color palette with the subject's facial features subtly blended in. "
               "Keep the Shiba Inu's pointed ears and characteristic snout, while incorporating "
               "enough of the person's features to make them recognizable.",

        "voxel": "Transform the subject into a detailed voxel art style that resembles popular "
                "collectibles. Create a 3D pixelated representation with vibrant colors "
                "and cube-based aesthetics. Keep the subject's facial structure and expression recognizable "
                "while adding stylized elements or patterns "
                "in the background. Make the style similar to popular games and metaverse avatars, with "
                "playful proportions and high color contrast. The final image should look like it belongs in "
                "a premium game or collectible, while still being clearly recognizable as the subject.",

        "pepe": "Create a Pepe the Frog transformation with the classic bright green color. "
                "Incorporate the wide, red lips and large, expressive eyes of Pepe. "
                "Maintain the cartoonish style while keeping enough of the subject's unique facial "
                "structure to make them recognizable. Pay special attention to the expression, "
                "making it match Pepe's often smug or sad look.",

        "bogdanoff": "Transform the subject into one of the Bogdanoff twins with their exaggerated "
                    "facial features. Focus on creating an extremely pronounced chin and cheekbones. "
                    "The skin should appear unnaturally smooth and tight. Incorporate an almost "
                    "alien-like quality to the transformation while maintaining some of the subject's "
                    "original features to keep them recognizable.",

        "npc": "Create an NPC (Non-Player Character) meme transformation with the characteristic "
              "gray face and blank expression. Use the simple, low-detail style with the gray/blue "
              "color palette. Keep the simplified facial features but incorporate enough of the "
              "subject's unique structure to make them recognizable. The expression should be "
              "completely neutral and emotionless.",

        "chad": "Transform the subject into the Nordic Chad/Yes meme character. Use the strong, "
               "exaggerated jawline and pronounced chin. The character should have blonde hair "
               "and beard if appropriate. Maintain the stoic, confident expression typical of "
               "the Chad meme while incorporating enough of the subject's unique features to "
               "make them recognizable.",

        "anime": "Transform the subject into an anime-style character with large expressive eyes, "
                 "simplified facial features, and vibrant colors characteristic of Japanese animation. "
                 "Keep the face proportions stylized with a smaller nose and mouth, but larger eyes. "
                 "Use clean lines and a slightly glossy finish to the skin. Maintain enough of the subject's "
                 "unique features to make them recognizable while applying the anime aesthetic. "
                 "The color palette should be bright and saturated with special attention to the eyes "
                 "to capture that signature anime look. Add some stylized elements or symbols "
                 "in the background to create the perfect "
                 "anime crossover.",

        "btc_laser_eyes": "Add vibrant, intense, glowing laser eyes to the uploaded face in celebration of viral meme culture. "
                         "Precisely retain the user's original facial features, natural expression, eye placement, and unique facial details. "
                         "Apply vivid, iconic red or bright-orange laser effects emanating powerfully from the eyes. "
                         "Ensure a striking, confident meme-style appearance while fully preserving the original background unchanged."
    }
    
    # Save to storage
    db.storage.json.put(sanitize_storage_key(EXTENDED_PROMPTS_KEY), default_prompts)
    
    return default_prompts

def get_extended_prompt(character_name):
    """Get extended prompt for a specific meme character
    
    Args:
        character_name: Name of the meme character (e.g., 'pepe', 'wojak')
        
    Returns:
        Extended prompt string or default prompt if not found
    """
    global _extended_prompts_cache
    
    # Initialize cache if needed
    if _extended_prompts_cache is None:
        try:
            _extended_prompts_cache = db.storage.json.get(sanitize_storage_key(EXTENDED_PROMPTS_KEY))
        except FileNotFoundError:
            # Initialize with defaults if not found
            _extended_prompts_cache = initialize_extended_prompts()
    
    # Return the prompt for the character or a generic default
    return _extended_prompts_cache.get(
        character_name, 
        "Transform the subject into the meme character while preserving their unique facial features and expression."
    )

def update_extended_prompt(character_name, new_prompt):
    """Update the extended prompt for a specific character
    
    Args:
        character_name: Name of the meme character (e.g., 'pepe', 'wojak')
        new_prompt: New extended prompt to use
        
    Returns:
        Updated prompts dictionary
    """
    global _extended_prompts_cache
    
    # Make sure cache is initialized
    if _extended_prompts_cache is None:
        try:
            _extended_prompts_cache = db.storage.json.get(sanitize_storage_key(EXTENDED_PROMPTS_KEY))
        except FileNotFoundError:
            _extended_prompts_cache = initialize_extended_prompts()
    
    # Update the prompt
    _extended_prompts_cache[character_name] = new_prompt
    
    # Save to storage
    db.storage.json.put(sanitize_storage_key(EXTENDED_PROMPTS_KEY), _extended_prompts_cache)
    
    return _extended_prompts_cache
