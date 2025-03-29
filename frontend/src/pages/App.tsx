import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/Card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { trackPageView, trackUpload, trackTemplateSelection } from "../utils/analytics";
import brain from "brain";
import { mode, Mode } from "app";
import { ShowcaseTimeline } from "../components/ShowcaseTimeline";
import { PhotoUpload } from "../components/PhotoUpload";
import { FeaturedMeme } from "../components/FeaturedMeme";

export default function App() {
  const navigate = useNavigate();
  
  // Track page view when component mounts
  useEffect(() => {
    trackPageView("home");
  }, []);
  
  // State for photo upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Example meme transformations with initial empty state
  const [exampleMemes, setExampleMemes] = useState<Array<{id: number; name: string; before: string; after: string;}>>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  // Default templates as fallback
  const DEFAULT_TEMPLATES = [
    {
      id: 1,
      name: "Laser Eyes",
      description: "Add intense glowing laser eyes to your portrait for a dramatic viral meme effect",
      before: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/file_00000000595c51f793b2cf77b895eaab_conversation_id=67e42e9d-b378-8003-afe2-ca6fdc84d963&message_id=8a018e62-64a7-4f06-9511-5ae0d10fd84b.webp",
      after: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/file_00000000595c51f793b2cf77b895eaab_conversation_id=67e42e9d-b378-8003-afe2-ca6fdc84d963&message_id=8a018e62-64a7-4f06-9511-5ae0d10fd84b.webp"
    },
    {
      id: 2,
      name: "Anime",
      description: "Transform your photo into a stylized anime character with distinct artistic features",
      before: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/file_00000000928852468decc77efd909c92_conversation_id=67e42e9d-b378-8003-afe2-ca6fdc84d963&message_id=16979e61-8b17-412d-849f-c7271c151ca6.webp",
      after: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/file_00000000928852468decc77efd909c92_conversation_id=67e42e9d-b378-8003-afe2-ca6fdc84d963&message_id=16979e61-8b17-412d-849f-c7271c151ca6.webp"
    },
    {
      id: 3,
      name: "Doge",
      description: "The iconic shiba inu meme that took over the internet and became a viral sensation",
      before: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/doge_classic.jpg",
      after: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/doge_classic.jpg"
    },
    {
      id: 4,
      name: "Pepe",
      description: "The internet's favorite green frog character used in countless viral memes",
      before: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/ChatGPT Image Mar 28, 2025, 11_58_36 AM.png",
      after: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/ChatGPT Image Mar 28, 2025, 11_58_36 AM.png"
    },
    {
      id: 5,
      name: "Voxel Art",
      description: "Transform your photo into vibrant 3D voxel art with stylized elements",
      before: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/file_000000001090520a96b4eeaa61403280_conversation_id=67e40412-11a8-8003-878c-174ffd4aa7b3&message_id=60b508bb-3d6c-4590-bbbf-f2b0ded02e45.webp",
      after: "https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/file_000000001090520a96b4eeaa61403280_conversation_id=67e40412-11a8-8003-878c-174ffd4aa7b3&message_id=60b508bb-3d6c-4590-bbbf-f2b0ded02e45.webp"
    }
  ];
  
  // Load available templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        console.log("Fetching templates for homepage");
        
        // Set default templates immediately so something shows even during loading
        setExampleMemes(DEFAULT_TEMPLATES);
        
        // Use the brain client to fetch templates
        let templatesData = {};
        try {
          const response = await brain.get_templates_public2();
          
          // Check if response is OK
          if (response.ok) {
            templatesData = await response.json();
          } else {
            console.error("Error fetching templates:", response.status, response.statusText);
            // Continue with default templates that were already set
            return;
          }
        } catch (apiError) {
          console.error("API error fetching templates:", apiError);
          // Continue with default templates that were already set
          return;
        }
        
        try {
          // Map API templates to example memes format
          const templatesEntries = Object.entries(templatesData);
          
          // Make sure all templates have descriptions
          Object.keys(templatesData).forEach(key => {
            if (!templatesData[key].description) {
              // Add default descriptions based on template name
              const templateName = (templatesData[key].name || '').toLowerCase();
              if (templateName.includes("doge")) {
                templatesData[key].description = "The iconic shiba inu meme that took over the internet and became a viral sensation";
              } else if (templateName.includes("pepe")) {
                templatesData[key].description = "The internet's favorite green frog character used in countless viral memes";
              } else if (templateName.includes("laser") || key === "btc_laser_eyes") {
                templatesData[key].description = "Add intense glowing laser eyes to your portrait for a dramatic viral meme effect";
              } else if (templateName.includes("voxel") || key === "voxel") {
                templatesData[key].description = "Transform your photo into vibrant 3D voxel art with stylized elements";
              } else {
                templatesData[key].description = "Transform your photos with this viral meme template";
              }
            }
          });
          
          // Helper function to find description from default templates
          function findDefaultDescription(name: string): string {
            const lowerName = (name || '').toLowerCase();
            if (lowerName.includes('doge')) {
              return "The iconic shiba inu meme that took over the internet and became a viral sensation";
            } else if (lowerName.includes('pepe')) {
              return "The internet's favorite green frog character used in countless viral memes";
            } else if (lowerName.includes('laser')) {
              return "Add intense glowing laser eyes to your portrait for a dramatic viral meme effect";
            } else if (lowerName.includes('voxel')) {
              return "Transform your photo into vibrant 3D voxel art with stylized elements";
            } else {
              return "Transform your photos with this viral meme template";
            }
          }
          
          // Filter out duplicates and unwanted templates
          const templatesArray = templatesEntries
            .filter(([_, template]) => {
              // Filter out duplicates and unwanted templates
              const templateName = (template.name || '').toLowerCase();
              return ![
                'wojak',
                'chad',
                'bogdanoff'
              ].includes(templateName);
            })
            .map(([id, template]: [string, any], index) => ({
              id: index + 1,
              name: template.name || '',
              description: template.description || findDefaultDescription(template.name || ''),
              before: template.url || '',
              after: template.url || ''
            }));
          
          // Deduplicate all templates - ensure uniqueness by name (case insensitive)
          const uniqueTemplatesSet = new Set<string>();
          const uniqueTemplatesArray: any[] = [];
          
          templatesArray.forEach(template => {
            if (!uniqueTemplatesSet.has(template.name.toLowerCase())) {
              uniqueTemplatesSet.add(template.name.toLowerCase());
              uniqueTemplatesArray.push(template);
            }
          });
          
          // Create a processed templates array to work with
          const processedTemplates: any[] = [];
          
          // First, check if we have a voxel template and add it first
          const voxelTemplate = templatesArray.find(t => 
            t.name.toLowerCase().includes('voxel'));
            
          if (voxelTemplate) {
            processedTemplates.push(voxelTemplate);
          } else {
            // If no voxel template in API results, add it from defaults
            const defaultVoxel = DEFAULT_TEMPLATES.find(t => 
              t.name.toLowerCase().includes('voxel'));
            if (defaultVoxel) {
              processedTemplates.push(defaultVoxel);
            }
          }
          
          // Add all non-voxel templates
          templatesArray.forEach(template => {
            if (!template.name.toLowerCase().includes('voxel')) {
              if (!processedTemplates.some(t => t.name.toLowerCase() === template.name.toLowerCase())) {
                processedTemplates.push(template);
              }
            }
          });
          
          // Use the safely processed templates array
          setExampleMemes(processedTemplates.slice(0, 6)); // Limit to 6 templates
        } catch (processingError) {
          console.error("Error processing templates data:", processingError);
          // Keep the default templates that were set at the beginning
        }
      } catch (error) {
        console.error("Unhandled error in template fetching:", error);
        // Ensure we always have templates to display
        setExampleMemes(DEFAULT_TEMPLATES);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleGetStarted = () => {
    if (uploadedFile && previewUrl) {
      handleContinueToTransform();
    } else {
      // Scroll to upload section
      document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Navigate to templates page
  const handleSeeAllTemplates = () => {
    navigate("/upload");
  };
  
  // Handle photo upload
  const handleUpload = (file: File) => {
    console.log("File uploaded:", file);
    setUploadedFile(file);
    
    // Track upload event
    trackUpload(file.size, file.type);
    
    // Create an object URL for the preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Clean up the object URL when the component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  // Handle navigation to preview page
  const handleContinueToTransform = () => {
    if (!uploadedFile || !previewUrl) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Construct the query parameters for the preview page
      const params = new URLSearchParams();
      params.append("imageId", Date.now().toString()); // Generate unique ID
      params.append("originalUrl", previewUrl);
      params.append("template", "btc_laser_eyes"); // Default template: Laser Eyes
      
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
            {uploadedFile ? (
              <Button variant="cyanNeon" size="sm" onClick={handleContinueToTransform}>
                Continue
              </Button>
            ) : (
              <Button 
                variant="cyanNeon" 
                size="sm" 
                onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Upload
              </Button>
            )}
            <Button variant="neon" size="sm" onClick={() => navigate("/meme-text")} className="hidden">
              AI Caption
            </Button>
            <Button 
              variant="neon" 
              size="sm" 
              onClick={() => navigate("/viral-ad-generator")}
            >
              Ad Creator
            </Button>
            <Button 
              variant="neon" 
              size="sm" 
              onClick={() => navigate("/motion-video")}
            >
              Motion Video
            </Button>
            <Button 
              variant="neon" 
              size="sm" 
              className="opacity-50 hover:opacity-100"
              onClick={() => navigate("/admin")}>
              Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-10 sm:py-20 container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-10">
          <div className="flex-1 space-y-4 sm:space-y-6">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
              <span className="text-[#00ffff] drop-shadow-[0_0_8px_#00ffff]">
                Transform
              </span>{" "}
              Your Face Into{" "}
              <span className="text-[#fe00fe] drop-shadow-[0_0_8px_#fe00fe]">
                Viral Memes
              </span>
            </h2>
            
            <p className="text-gray-300">Turn your selfies into hilarious viral meme characters with our 
              AI-powered face swap technology. Simple, fast, and ridiculously fun.</p>
            
            <div className="pt-4">
              <Button variant="neon" size="xl" onClick={handleGetStarted}>
                {uploadedFile ? "Continue to Transform" : "Get Started"}
              </Button>
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="space-y-2">
              <FeaturedMeme className="w-full mx-auto" autoChangeInterval={7000} />
              <p className="text-center text-[#fe00fe] text-sm font-bold drop-shadow-[0_0_5px_#fe00fe]">
                Top Liked Memes This Week
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section id="upload-section" className="relative z-10 py-16 container mx-auto px-4 border-t border-[#00ffff]/30">
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
                
                <div className="flex justify-end">
                  <Button 
                    variant="neon" 
                    size="lg" 
                    onClick={handleContinueToTransform}
                    disabled={isUploading}
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
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-16 container mx-auto px-4 border-t border-[#00ffff]/30">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#00ffff] drop-shadow-[0_0_5px_#00ffff]">
          Available Meme Templates
        </h2>
        
        {isLoadingTemplates ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fe00fe] mb-4"></div>
            <p className="text-gray-400">Loading templates...</p>
          </div>
        ) : exampleMemes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {exampleMemes.map((meme) => (
              <Card key={meme.id} variant={meme.id % 2 === 0 ? "cyan" : "neon"} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative group">
                    <img 
                      src={meme.before} 
                      alt={`${meme.name} before`} 
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="text-center p-3">
                        <p className="text-xl font-bold mb-1">{meme.name}</p>
                        <p className="text-sm text-gray-300 mb-2">{meme.description || "Transform your photos with this viral meme template"}</p>
                        <Button 
                          variant={meme.id % 2 === 0 ? "cyanNeon" : "neon"} 
                          size="sm"
                          onClick={() => {
                            // Track template selection
                            try {
                              const templateId = meme.name.toLowerCase();
                              if (typeof trackTemplateSelection === 'function') {
                                trackTemplateSelection(templateId, meme.name);
                              }
                            } catch (error) {
                              console.error("Error tracking template selection:", error);
                              // Continue with navigation even if tracking fails
                            }
                            
                            const params = new URLSearchParams();
                            params.append("imageId", "demo-image-id");
                            params.append("originalUrl", meme.before);
                            
                            // Use the correct templateId format
                            // For example, for "Laser Eyes", use "btc_laser_eyes" as the ID
                            let actualTemplateId = "";
                            
                            // Map common template names to their correct IDs using case-insensitive comparison
                            const nameLower = meme.name.toLowerCase();
                            if (nameLower.includes("laser") || nameLower === "laser eyes") {
                              actualTemplateId = "btc_laser_eyes";
                            } else if (nameLower.includes("voxel") || nameLower === "voxel art") {
                              actualTemplateId = "voxel";
                            } else if (nameLower.includes("doge")) {
                              actualTemplateId = "doge";
                            } else if (nameLower.includes("pepe")) {
                              actualTemplateId = "pepe";
                            } else {
                              // Default to a template ID that matches the name format
                              actualTemplateId = nameLower.replace(/\s+/g, "_");
                            }
                            
                            params.append("template", actualTemplateId);
                            navigate(`/preview?${params.toString()}`);
                          }}
                        >
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-[#fe00fe]/30 rounded-lg">
            <p className="text-gray-400">No templates available. Please try refreshing the page.</p>
          </div>
        )}
        
        <div className="mt-12 text-center">
          <Button variant="neon" size="lg" onClick={handleSeeAllTemplates}>
            Upload & Transform Your Photo
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-16 container mx-auto px-4 border-t border-[#fe00fe]/30">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#fe00fe] drop-shadow-[0_0_5px_#fe00fe]">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card variant="neon" className="backdrop-blur-sm bg-black/40">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#fe00fe]/20 border border-[#fe00fe] flex items-center justify-center">
                <span className="text-2xl font-bold text-[#fe00fe]">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Upload Your Photo</h3>
              <p className="text-gray-300">Upload a selfie or any photo with a face that you want to transform.</p>
            </CardContent>
          </Card>
          
          <Card variant="cyan" className="backdrop-blur-sm bg-black/40">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00ffff]/20 border border-[#00ffff] flex items-center justify-center">
                <span className="text-2xl font-bold text-[#00ffff]">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Select Meme Template</h3>
              <p className="text-gray-300">Choose from popular viral meme templates like Doge, Pepe, Voxel Art, Anime, and Laser Eyes.</p>
            </CardContent>
          </Card>
          
          <Card variant="neon" className="backdrop-blur-sm bg-black/40">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#fe00fe]/20 border border-[#fe00fe] flex items-center justify-center">
                <span className="text-2xl font-bold text-[#fe00fe]">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Download & Share</h3>
              <p className="text-gray-300">Get your personalized meme instantly and share it with friends and the meme community.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Community Showcase Section */}
      <section className="relative z-10 py-16 container mx-auto px-4 border-t border-[#00ffff]/30 bg-black/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#00ffff] mb-3 drop-shadow-[0_0_8px_#00ffff]">
            Community Showcase
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Check out what other viral meme enthusiasts have created with MemeSwap
          </p>
        </div>
        
        <ShowcaseTimeline limit={6} />
        
        <div className="text-center mt-10">
          <Button variant="neon" onClick={() => navigate("/upload")}>
            Create Your Own
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 container mx-auto px-4 border-t border-[#00ffff]/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold">
            Ready to Become a Viral Meme Legend?
          </h2>
          <p className="text-xl text-gray-300">
            Join thousands of meme enthusiasts who have already transformed their photos.
          </p>
          <div className="pt-4">
            <Button 
              variant="neon" 
              size="xl" 
              onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Upload Your Photo Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#fe00fe]/40 shadow-[0_0_5px_#fe00fe] bg-black/60 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2025 MemeSwap · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
