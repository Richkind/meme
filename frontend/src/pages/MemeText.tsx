import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/Card";
import { MemeTemplateSelector } from "../components/MemeTemplateSelector";
import { MemeTextGenerator } from "../components/MemeTextGenerator";
import { trackPageView } from "../utils/analytics";
import brain from "brain";

export default function MemeText() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Record<string, any>>({
    doge: {
      name: "Doge",
      description: "The iconic shiba inu meme that took over the internet and became a viral sensation",
      url: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/doge_classic.jpg"  // Updated Doge
    },
    pepe: {
      name: "Pepe",
      description: "The internet's favorite green frog character used in countless viral memes",
      url: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/ChatGPT Image Mar 28, 2025, 11_58_36 AM.png"  // Updated Pepe
    },
    btc_laser_eyes: {
      name: "Laser Eyes",
      description: "Add intense glowing laser eyes to your portrait for a dramatic viral meme effect",
      url: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/laser_eyes_generic.jpg"  // Generic laser eyes image
    },
    voxel: {
      name: "Voxel Art",
      description: "Transform your photo into vibrant 3D voxel art with stylized elements",
      url: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/file_000000001090520a96b4eeaa61403280_conversation_id=67e40412-11a8-8003-878c-174ffd4aa7b3&message_id=60b508bb-3d6c-4590-bbbf-f2b0ded02e45.webp"  // Voxel art example
    }
  });
  const [currentCaption, setCurrentCaption] = useState<string>("");
  
  // Track page view
  useEffect(() => {
    trackPageView("meme_text");
  }, []);

  // Load available templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        // Use the brain client to fetch templates
        const response = await brain.get_templates_public2();
        
        // Check if response is OK
        if (response.ok) {
          const data = await response.json();
          
          // Make sure all templates have descriptions
          Object.keys(data).forEach(key => {
            if (!data[key].description) {
              // Add default descriptions based on template name
              const templateName = (data[key].name || '').toLowerCase();
              if (templateName.includes("doge")) {
                data[key].description = "The iconic shiba inu meme that took over the internet and became a viral sensation";
              } else if (templateName.includes("pepe")) {
                data[key].description = "The internet's favorite green frog character used in countless viral memes";
              } else if (templateName.includes("laser") || key === "btc_laser_eyes") {
                data[key].description = "Add intense glowing laser eyes to your portrait for a dramatic viral meme effect";
              } else if (templateName.includes("voxel") || key === "voxel") {
                data[key].description = "Transform your photo into vibrant 3D voxel art with stylized elements";
              } else {
                data[key].description = "Transform your photos with this viral meme template";
              }
            }
          });
          
          setTemplates(data);
          console.log("Templates loaded successfully:", data);
        } else {
          console.error("Error fetching templates:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="h-full w-full bg-[linear-gradient(#00ffff_1px,transparent_1px),linear-gradient(90deg,#00ffff_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      </div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-[#fe00fe]/40 shadow-[0_0_5px_#fe00fe] bg-black/60 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#fe00fe]">
            MemeSwap
          </h1>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <Button variant="cyanNeon" size="sm" onClick={() => navigate("/upload")}>
              Upload
            </Button>
            <Button variant="neon" size="sm" onClick={() => navigate("/")}>
              Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <Card variant="neon" className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-[#00ffff] drop-shadow-[0_0_5px_#00ffff]">
              AI Meme Caption Generator
            </CardTitle>
            <CardDescription className="text-gray-300">
              Create hilarious viral meme captions for your images using GPT-4o AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Template Selector */}
            <div className="mb-8">
              <h2 className="text-[#fe00fe] text-xl font-bold mb-4 drop-shadow-[0_0_5px_#fe00fe]">
                Step 1: Choose a Meme Template
              </h2>
              <MemeTemplateSelector
                templates={templates}
                selectedTemplate={selectedTemplate}
                onSelect={(templateId) => {
                  setSelectedTemplate(templateId);
                  // Track template selection with error handling
                  try {
                    if (templates[templateId] && templates[templateId].name) {
                      trackTemplateSelection(templateId, templates[templateId].name);
                    }
                  } catch (error) {
                    console.error("Error tracking template selection:", error);
                    // Continue with template selection even if tracking fails
                  }
                }}
                disabled={isLoading}
              />
            </div>

            {/* Caption Generator */}
            {selectedTemplate ? (
              <div className="mb-6">
                <h2 className="text-[#00ffff] text-xl font-bold mb-4 drop-shadow-[0_0_5px_#00ffff]">
                  Step 2: Generate Your Meme Caption
                </h2>
                <MemeTextGenerator 
                  templateId={selectedTemplate}
                  onCaptionGenerated={setCurrentCaption}
                />
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-[#fe00fe]/40 rounded-lg text-center">
                <p className="text-gray-400">Select a template to generate captions</p>
              </div>
            )}
            
            {/* Action Buttons */}
            {currentCaption && (
              <div className="mt-8 pt-6 border-t border-[#fe00fe]/30 flex flex-col items-center">
                <p className="text-gray-300 mb-4">Ready to create your meme with this caption?</p>
                <Button 
                  variant="neon" 
                  size="lg"
                  onClick={() => navigate("/upload")}
                >
                  Upload Your Photo Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
