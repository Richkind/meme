import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TransformationResult } from "../components/TransformationResult";
import { Button } from "../components/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/Card";
import { MemeTemplateSelector } from "../components/MemeTemplateSelector";
import { trackPageView, trackTransformationComplete, trackTemplateSelection } from "../utils/analytics";
import { mode, Mode, API_URL } from "../constants";
import brain from "brain";
import { MemeTextGenerator } from "../components/MemeTextGenerator";

// No longer need to manually construct API URLs as we use the brain client
// which handles this for us automatically

export default function Preview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [memeCaption, setMemeCaption] = useState<string | null>(null);
  const [alternativeCaptions, setAlternativeCaptions] = useState<string[]>([]);
  const [modelInfo, setModelInfo] = useState<{ imageModel: string; textModel: string } | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [showCaptionInput, setShowCaptionInput] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState({});
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  // Track page view
  useEffect(() => {
    trackPageView("preview");
  }, []);

  // Load available templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        console.log("Fetching templates using Brain client");
        
        // Use the brain client to fetch templates from the new meme generator API
        try {
          console.log("Fetching templates from meme generator API");
          const response = await fetch(`${API_URL}/meme-generator/meme-templates`);
          if (response.ok) {
            const data = await response.json();
            setTemplates(data);
          } else {
            throw new Error("Failed to fetch templates");
          }
        } catch (error) {
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
        // Fall back to default templates
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

  useEffect(() => {
    const processImage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {        
        const imageId = searchParams.get("imageId");
        const template = searchParams.get("template") || "btc_laser_eyes";
        
        console.log("Processing image with ID:", imageId, "and template:", template);
        
        // For demo: Use a URL parameter to simulate an error
        if (searchParams.get("error") === "true") {
          throw new Error("Failed to process image. Please try again.");
        }
        
        if (imageId) {
          const originalUrl = searchParams.get("originalUrl");
          if (!originalUrl) {
            throw new Error("No original image URL provided.");
          }
          
          console.log("Original image URL:", originalUrl);
          setOriginalImage(originalUrl);
          setSelectedTemplate(template);
          
          // Wait for templates to load before proceeding
          if (!isLoadingTemplates) {
            if (Object.keys(templates).length > 0) {
              console.log("Templates loaded, proceeding with transformation");
              
              // Check if the selected template exists in our templates object
              // If not, fall back to "btc_laser_eyes" or first available template
              let templateToUse = template;
              
              // Case insensitive check for templates
              if (!templates[templateToUse]) {
                // Try to find a template with a case-insensitive match
                const templateKeys = Object.keys(templates);
                const matchingKey = templateKeys.find(key => 
                  key.toLowerCase() === templateToUse.toLowerCase());
                  
                if (matchingKey) {
                  templateToUse = matchingKey;
                } else if (templates["btc_laser_eyes"]) {
                  templateToUse = "btc_laser_eyes";
                } else if (templateKeys.length > 0) {
                  templateToUse = templateKeys[0];
                }
              }
              
              console.log("Available templates:", Object.keys(templates));
              console.log("Selected template:", template);
              console.log("Template to use:", templateToUse);
              
              if (templateToUse) {
                setSelectedTemplate(templateToUse);
                // Now call the FaceSwap API to transform the image
                await transformImage(originalUrl, templateToUse);
              } else {
                throw new Error("No valid template found. Please refresh and try again.");
              }
            } else {
              console.error("No templates available after loading");
              setError("Failed to load meme templates. Please refresh the page and try again.");
            }
          } else {
            console.log("Templates still loading, will wait...");
          }
        } else {
          throw new Error("No image provided. Please upload an image first.");
        }
      } catch (err) {
        console.error("Error processing image:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    processImage();
  }, [searchParams, isLoadingTemplates, templates]);

  // Function to transform the image using the Gemini API
  const transformImage = async (imageUrl: string, templateId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, fetch the image data from the URL
      console.log("Fetching image from URL:", imageUrl);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch original image");
      }
      
      const imageBlob = await imageResponse.blob();
      
      // Create a FormData object and append the file and template ID
      const formData = new FormData();
      const imageFile = new File([imageBlob], "user-image.jpg", { type: imageBlob.type });
      formData.append("user_image", imageFile);
      formData.append("template_id", templateId);
      
      console.log("Sending transform request to Gemini API with template:", templateId);
      
      // Use the brain client to transform the image with our new Gemini endpoint
      // We need to use FormData directly since that's what our endpoint expects
      
      // Use API_URL constant instead of hardcoded URL
      const url = `${API_URL}/meme-generator/transform`;
      
      // Make the fetch call with FormData
      const transformResponse = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: formData
      });
      
      if (!transformResponse.ok) {
        console.error("Transform response error:", transformResponse.status, transformResponse.statusText);
        let errorText;
        try {
          const errorData = await transformResponse.json();
          errorText = errorData.detail || "Failed to transform image";
          console.error("Error response body:", errorData);
        } catch (textError) {
          console.error("Could not read error response text", textError);
          errorText = "Failed to transform image";
        }
        throw new Error(errorText);
      }
      
      // Get the response data which contains the transformed image as a data URL
      const responseData = await transformResponse.json();
      
      if (!responseData.success || !responseData.image_url) {
        throw new Error(responseData.message || "Failed to transform image");
      }
      
      // Set the transformed image directly from the data URL
      setTransformedImage(responseData.image_url);
      
      // Set default model info for Gemini
      setModelInfo({
        imageModel: "Google Gemini 2.0 Flash",
        textModel: "N/A"
      });
      
      // Clear captions as they're not supported in this simplified version
      setMemeCaption(null);
      setAlternativeCaptions([]);
      
      console.log("Transform successful with Gemini API");
      
      // Track the successful transformation
      trackTransformationComplete(templateId);
    } catch (err) {
      console.error("Error transforming image with Gemini:", err);
      setError(err instanceof Error ? err.message : "Failed to transform image");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    if (templateId === selectedTemplate) return;
    
    // Track template selection
    if (templates[templateId]) {
      try {
        const templateName = templates[templateId].name || templateId;
        trackTemplateSelection(templateId, templateName);
      } catch (error) {
        console.error("Error tracking template selection:", error);
        // Continue with template change even if tracking fails
      }
    }
    
    setSelectedTemplate(templateId);
    
    if (originalImage) {
      transformImage(originalImage, templateId);
    }
  };

  const handleNewTransformation = () => {
    navigate("/upload");
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
              New
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
        <Card variant="neon" className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle className="text-[#00ffff] drop-shadow-[0_0_5px_#00ffff]">
              Your Viral Meme Transformation
            </CardTitle>
            <CardDescription className="text-gray-300">
              {selectedTemplate && templates[selectedTemplate] ? 
                `Template: ${templates[selectedTemplate].name || selectedTemplate} - ${templates[selectedTemplate].description || "Transform your photos with this viral meme template"}` : 
                "Select a template below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-500 mb-6 p-4 border border-red-500 bg-red-500/10 rounded-lg">
                {error}
              </div>
            ) : null}

            
            
            {/* Template Selector */}
            <div className="mb-6">
              <h2 className="text-[#fe00fe] text-xl font-bold mb-4 drop-shadow-[0_0_5px_#fe00fe]">
                Choose a Meme Template
              </h2>
              <MemeTemplateSelector
                templates={templates}
                selectedTemplate={selectedTemplate}
                onSelect={handleTemplateChange}
                disabled={isLoading || !originalImage}
              />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fe00fe] mb-4"></div>
                <p className="text-gray-400">Processing your image...</p>
              </div>
            )}

            {/* Success State with Transformation Result */}
            {!isLoading && originalImage && transformedImage && (
              <TransformationResult
                originalImage={originalImage}
                transformedImage={transformedImage}
                templateId={selectedTemplate}
                onNewTransformation={handleNewTransformation}
                isLoading={isLoading}
                error={error}
                caption={memeCaption}
                alternativeCaptions={alternativeCaptions}
                onSelectAlternative={(caption) => setMemeCaption(caption)}
                modelInfo={modelInfo}
              />
            )}

            {/* No Image State */}
            {!isLoading && !originalImage && !error && (
              <div className="p-12 text-center">
                <p className="text-gray-400 mb-4">No transformation data found</p>
                <Button variant="neon" onClick={() => navigate("/upload")}>
                  Upload an Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
