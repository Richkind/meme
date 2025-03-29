import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PhotoUpload } from "../components/PhotoUpload";
import { Button } from "../components/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/Card";
import { trackPageView, trackUpload, trackTemplateSelection } from "../utils/analytics";
import { MemeTemplateSelector } from "../components/MemeTemplateSelector";
import brain from "brain";

export default function UploadPage() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Sample meme templates for initial loading
  const [templates, setTemplates] = useState({});
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  

  // Track page view
  useEffect(() => {
    trackPageView("upload");
  }, []);

  // Load available templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        console.log("Fetching templates using Brain client");
        
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
          // Fall back to default templates from DEFAULT_TEMPLATES
          const defaultTemplates = {
            doge: {
              name: "Doge",
              description: "The iconic shiba inu meme that took over the internet and became a viral sensation",
              url: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/doge_classic.jpg"  // Updated Doge
            },
            pepe: {
              name: "Pepe",
              description: "The internet's favorite green frog character used in countless viral memes",
              url: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/pepe_classic.jpg"  // Updated Pepe
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
          };
          setTemplates(defaultTemplates);
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
        // Fall back to default templates from DEFAULT_TEMPLATES
        const defaultTemplates = {
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
            url: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/laser_eyes_generic.jpg"  // Laser eyes meme image
          },
          voxel: {
            name: "Voxel Art",
            description: "Transform your photo into vibrant 3D voxel art with stylized elements",
            url: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/file_000000001090520a96b4eeaa61403280_conversation_id=67e40412-11a8-8003-878c-174ffd4aa7b3&message_id=60b508bb-3d6c-4590-bbbf-f2b0ded02e45.webp"  // Voxel art example
          }
        };
        setTemplates(defaultTemplates);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleUpload = (file: File) => {
    console.log("File uploaded:", file);
    setUploadedFile(file);
    setSelectedTemplate(null); // Reset template selection when new file is uploaded
    
    // Track upload event
    trackUpload(file.size, file.type);
    
    // Create an object URL for the preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Clean up the object URL when the component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleNext = () => {
    if (!uploadedFile || !previewUrl) {
      setUploadError("Please upload an image first.");
      return;
    }
    
    if (!selectedTemplate) {
      setUploadError("Please select a meme template before continuing.");
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Construct the query parameters for the preview page
      const params = new URLSearchParams();
      params.append("imageId", Date.now().toString()); // Generate unique ID
      params.append("originalUrl", previewUrl);
      params.append("template", selectedTemplate);
      
      // Navigate to the preview page with the query parameters
      navigate(`/preview?${params.toString()}`);
    } catch (error) {
      console.error("Error processing image:", error);
      setUploadError("Failed to process image. Please try again.");
      setIsUploading(false);
    }
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
            <Button variant="cyanNeon" size="sm" onClick={() => navigate("/preview")}>
              Preview
            </Button>
            <Button variant="neon" size="sm" onClick={() => navigate("/meme-text")}>
              AI Caption
            </Button>
            <Button variant="neon" size="sm" onClick={() => navigate("/")}>
              Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <Card variant="neon" className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-[#00ffff] drop-shadow-[0_0_5px_#00ffff]">
              Upload Your Photo
            </CardTitle>
            <CardDescription className="text-gray-300">
              Upload a clear photo of your face to transform it into a viral meme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUpload onUpload={handleUpload} maxSizeMB={10} />
            
            {uploadedFile && (
              <div className="mt-8">
                {uploadError ? (
                  <div className="text-red-500 mb-4 p-3 border border-red-500 rounded bg-red-500/10">
                    {uploadError}
                  </div>
                ) : null}
                
                <h3 className="text-[#fe00fe] text-xl font-bold mb-4 drop-shadow-[0_0_5px_#fe00fe]">
                  Choose a Meme Template
                </h3>
                <div className="mb-6">
                  {isLoadingTemplates ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fe00fe]"></div>
                    </div>
                  ) : Object.keys(templates).length > 0 ? (
                    <MemeTemplateSelector
                      templates={templates}
                      selectedTemplate={selectedTemplate}
                      onSelect={(templateId) => {
                        setSelectedTemplate(templateId);
                        // Track template selection
                        try {
                          if (templates[templateId] && templates[templateId].name) {
                            trackTemplateSelection(templateId, templates[templateId].name);
                          }
                        } catch (error) {
                          console.error("Error tracking template selection:", error);
                          // Continue with template selection even if tracking fails
                        }
                      }}
                      disabled={isUploading}
                    />
                  ) : (
                    <div className="text-center p-4 border border-[#fe00fe]/30 rounded-lg">
                      <p className="text-gray-400">No templates available. Please try refreshing the page.</p>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    variant="neon" 
                    size="lg" 
                    onClick={handleNext}
                    disabled={isUploading || !selectedTemplate}
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#fe00fe]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Continue to Transform"
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-[#fe00fe]/30">
              <h3 className="text-lg font-semibold mb-4 text-[#fe00fe]">
                Tips for Best Results
              </h3>
              <ul className="space-y-2 text-gray-300 list-disc pl-5">
                <li>Use a well-lit photo with a clear view of your face</li>
                <li>Front-facing portraits work best</li>
                <li>Avoid photos with multiple people or complex backgrounds</li>
                <li>Higher resolution images provide better quality results</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
