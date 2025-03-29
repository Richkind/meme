import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/Card";
import { PhotoUpload } from "../components/PhotoUpload";
import { trackPageView } from "../utils/analytics";
import brain from "brain";

export default function MotionVideo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Track page view
  useEffect(() => {
    trackPageView("motion_video");
  }, []);
  
  // State for the uploaded file
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // State for video generation
  const [prompt, setPrompt] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  
  // Handle file upload
  const handleUpload = (file: File) => {
    console.log("File uploaded:", file);
    setUploadedFile(file);
    
    // Reset video states
    setVideoId(null);
    setVideoUrl(null);
    setGenerationStatus(null);
    setGenerationError(null);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Clean up object URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };
  
  // Generate motion video
  const handleGenerateVideo = async () => {
    if (!previewUrl) {
      setGenerationError("Please upload an image first");
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Call our backend API
      const response = await brain.generate_motion_video({
        image_url: previewUrl,
        prompt: prompt || "high quality animation of the image, smooth motion, cinematic lighting",
        video_length: 48, // 2 seconds at 24fps
      });
      
      const data = await response.json();
      console.log("Video generation started:", data);
      
      // Store the video ID
      setVideoId(data.video_id);
      setGenerationStatus("processing");
      
      // Start polling for status
      pollVideoStatus(data.video_id);
    } catch (err) {
      console.error("Error generating video:", err);
      setGenerationError("Failed to start video generation");
      setIsGenerating(false);
    }
  };
  
  // Poll for video status
  const pollVideoStatus = async (id: string) => {
    try {
      // Check status every 3 seconds
      const interval = setInterval(async () => {
        try {
          const response = await brain.get_motion_video_status({ video_id: id });
          const data = await response.json();
          console.log("Video status:", data);
          
          setGenerationStatus(data.status);
          
          if (data.status === "completed" && data.video_url) {
            setVideoUrl(data.video_url);
            setIsGenerating(false);
            clearInterval(interval);
          } else if (data.status === "failed") {
            setGenerationError(data.error || "Failed to generate video");
            setIsGenerating(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error polling video status:", err);
        }
      }, 3000);
      
      // Clear interval after 5 minutes (timeout)
      setTimeout(() => {
        clearInterval(interval);
        if (generationStatus === "processing") {
          setGenerationStatus("failed");
          setGenerationError("Timed out waiting for video generation");
          setIsGenerating(false);
        }
      }, 5 * 60 * 1000);
      
      // Clear interval when component unmounts
      return () => clearInterval(interval);
    } catch (err) {
      console.error("Error setting up polling:", err);
      setGenerationError("Failed to check video status");
      setIsGenerating(false);
    }
  };
  
  // Handle video download
  const handleDownloadVideo = async () => {
    if (!videoUrl) return;
    
    try {
      // Open video in new tab
      window.open(videoUrl, "_blank");
    } catch (err) {
      console.error("Error downloading video:", err);
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
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate("/")}
              className="text-[#00ffff] hover:text-[#00ffff]/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#fe00fe]">
              Motion Video Generator
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Intro Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-[#00ffff] drop-shadow-[0_0_8px_#00ffff]">
                Add Motion
              </span>{" "}
              to Your Viral Memes
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Transform your static images into eye-catching motion videos with AI
            </p>
          </div>
          
          {/* Upload and Preview Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Left: Upload Section */}
            <Card variant="neon" className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-[#fe00fe] drop-shadow-[0_0_5px_#fe00fe]">
                  Upload Image
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Upload an image to animate with motion effects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoUpload onUpload={handleUpload} maxSizeMB={10} />
                
                <div className="mt-6">
                  <label className="block text-[#00ffff] font-medium mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    className="w-full bg-black/50 border-2 border-[#00ffff] rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00ffff] transition-all"
                    rows={3}
                    placeholder="Describe the motion you want (e.g., 'smooth floating movement, gentle camera zoom')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                
                <div className="mt-6">
                  <Button
                    variant="cyanNeon"
                    size="lg"
                    className="w-full"
                    onClick={handleGenerateVideo}
                    disabled={!previewUrl || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#00ffff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      "Generate Motion Video"
                    )}
                  </Button>
                </div>
                
                {generationError && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-400">
                    {generationError}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Right: Preview Section */}
            <div className="space-y-6">
              <Card variant="cyan" className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-[#00ffff] drop-shadow-[0_0_5px_#00ffff]">
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="aspect-video bg-black/50 rounded-md overflow-hidden flex items-center justify-center">
                    {videoUrl ? (
                      <video 
                        src={videoUrl} 
                        className="w-full h-auto" 
                        controls 
                        autoPlay 
                        loop 
                      />
                    ) : previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-auto" 
                      />
                    ) : (
                      <div className="text-gray-400 text-center p-4">
                        Upload an image to see preview
                      </div>
                    )}
                  </div>
                  
                  {videoUrl && (
                    <div className="mt-4">
                      <Button 
                        variant="cyanNeon" 
                        size="lg" 
                        className="w-full" 
                        onClick={handleDownloadVideo}
                      >
                        Download Video
                      </Button>
                    </div>
                  )}
                  
                  {generationStatus === "processing" && (
                    <div className="mt-4 p-3 bg-[#00ffff]/10 border border-[#00ffff] rounded-md text-center">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#00ffff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-[#00ffff]">Processing your video...</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        This may take up to a minute. Please be patient.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Template Showcase */}
          <Card variant="neon" className="mb-12">
            <CardHeader>
              <CardTitle className="text-[#fe00fe] drop-shadow-[0_0_5px_#fe00fe]">
                Template Showcase
              </CardTitle>
              <CardDescription className="text-gray-300">
                Use these popular viral meme templates for the best motion effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pepe Template */}
                <div className="relative group overflow-hidden rounded-lg border border-[#00ffff] bg-black">
                  <img 
                    src="https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/ChatGPT Image Mar 27, 2025, 06_17_48 PM.png" 
                    alt="Pepe Template" 
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3 className="text-[#00ffff] font-bold text-lg">Pepe Template</h3>
                    <p className="text-white text-sm">Perfect for viral reactions</p>
                    <Button 
                      variant="cyanNeon" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.open("https://static.databutton.com/public/ec7be075-eaf6-40e6-b540-920274c1dc36/ChatGPT Image Mar 27, 2025, 06_17_48 PM.png", "_blank")}
                    >
                      Download
                    </Button>
                  </div>
                </div>
                
                {/* Ghibli Template */}
                <div className="relative group overflow-hidden rounded-lg border border-[#fe00fe] bg-black">
                  <img 
                    src="https://i.imgur.com/mP4pfJ2.jpg" 
                    alt="Anime Style Template" 
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3 className="text-[#fe00fe] font-bold text-lg">Anime Style</h3>
                    <p className="text-white text-sm">Anime aesthetic for memes</p>
                    <Button 
                      variant="magentaNeon" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.open("https://i.imgur.com/mP4pfJ2.jpg", "_blank")}
                    >
                      Download
                    </Button>
                  </div>
                </div>
                

              </div>
            </CardContent>
          </Card>
          
          {/* Instructions */}
          <Card variant="neon" className="mb-12">
            <CardHeader>
              <CardTitle className="text-[#fe00fe] drop-shadow-[0_0_5px_#fe00fe]">
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#fe00fe]/20 border border-[#fe00fe] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#fe00fe]">1</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Upload Image</h3>
                  <p className="text-gray-300">Upload any image you want to animate</p>
                </div>
                
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#00ffff]/20 border border-[#00ffff] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#00ffff]">2</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Add Description</h3>
                  <p className="text-gray-300">Optionally describe the motion you want</p>
                </div>
                
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#fe00fe]/20 border border-[#fe00fe] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#fe00fe]">3</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Download & Share</h3>
                  <p className="text-gray-300">Get your animated video and share with friends</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tips */}
          <Card variant="cyan" className="mb-12">
            <CardHeader>
              <CardTitle className="text-[#00ffff] drop-shadow-[0_0_5px_#00ffff]">
                Tips for Best Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-300 list-disc pl-5">
                <li>Use high-quality images with clear subjects</li>
                <li>Images with clear foreground/background separation work best</li>
                <li>Be specific in your description for more controlled motion</li>
                <li>Faces and characters usually animate better than text-heavy images</li>
                <li>The generated video is short but perfect for social media attention-grabbing</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
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
