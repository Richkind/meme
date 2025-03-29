import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardContent } from "../components/Card";
import { trackPageView } from "../utils/analytics";
import brain from "brain";
import { API_URL } from "../constants";

interface Category {
  [key: string]: string;
}

interface AdResult {
  image_url: string;
  prompt_used: string;
  category: string;
  generation_id: string;
}

const ViralAdGenerator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("meme");
  const [styleKeywords, setStyleKeywords] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category>({});
  const [generatedAd, setGeneratedAd] = useState<AdResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Predefined style suggestions
  const styleSuggestions = [
    "cyberpunk",
    "neon",
    "minimalist",
    "retro",
    "futuristic",
    "pixel art",
    "vaporwave",
    "synthwave",
    "glitch",
    "3D",
  ];

  // Fetch available categories when component mounts
  useEffect(() => {
    trackPageView("viral_ad_generator");
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/viral-ads/categories`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load ad categories. Please try again later.");
    }
  };

  const handleGenerateAd = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to generate an ad.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/viral-ads/generate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          category: selectedCategory,
          style_keywords: styleKeywords.split(",").map(kw => kw.trim()).filter(kw => kw !== ""),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate ad");
      }

      const result = await response.json();
      setGeneratedAd(result);
    } catch (error) {
      console.error("Error generating ad:", error);
      setError(error instanceof Error ? error.message : "Failed to generate ad. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedAd?.image_url) {
      const link = document.createElement("a");
      link.href = generatedAd.image_url;
      link.download = `viral-ad-${generatedAd.generation_id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const addStyleKeyword = (keyword: string) => {
    const currentKeywords = styleKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k !== "");
    
    if (!currentKeywords.includes(keyword)) {
      const newKeywords = [...currentKeywords, keyword].join(", ");
      setStyleKeywords(newKeywords);
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
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#fe00fe]">
            Viral Ad Generator
          </h1>
          <Button variant="cyanNeon" size="sm" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 relative z-10">
        <div className="mb-8 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-[#00ffff] drop-shadow-[0_0_5px_#00ffff]">
            Create Your Viral Meme Ad
          </h2>
          <p className="text-gray-300 text-lg">
            Describe your perfect viral advertisement and our AI will generate it for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card variant="neon" className="backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-[#fe00fe] font-medium mb-2" htmlFor="prompt">
                    Describe Your Ad
                  </label>
                  <textarea
                    id="prompt"
                    className="w-full h-32 p-3 bg-black/50 border-2 border-[#fe00fe] text-white rounded-md focus:border-[#00ffff] focus:ring focus:ring-[#00ffff]/20 transition-all focus:outline-none"
                    placeholder="E.g., A distracted boyfriend meme with viral trends, or a surprised Pikachu reacting to social media trends"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-[#fe00fe] font-medium mb-2">Ad Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(categories).map(([key, description]) => (
                      <div 
                        key={key}
                        className={`border p-3 rounded-md cursor-pointer transition-all ${selectedCategory === key 
                          ? 'border-[#00ffff] bg-[#00ffff]/10 shadow-[0_0_10px_#00ffff]' 
                          : 'border-[#fe00fe]/50 hover:border-[#fe00fe]'}`}
                        onClick={() => setSelectedCategory(key)}
                      >
                        <h3 className="font-bold mb-1 capitalize">{key}</h3>
                        <p className="text-xs text-gray-400">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-[#fe00fe] font-medium mb-2" htmlFor="styleKeywords">
                    Style Keywords (optional)
                  </label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {styleSuggestions.map((style) => (
                      <span
                        key={style}
                        className="inline-block px-2 py-1 bg-[#fe00fe]/20 border border-[#fe00fe]/40 rounded-md text-sm cursor-pointer hover:bg-[#fe00fe]/30 transition-colors"
                        onClick={() => addStyleKeyword(style)}
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                  <input
                    id="styleKeywords"
                    className="w-full p-3 bg-black/50 border-2 border-[#fe00fe] text-white rounded-md focus:border-[#00ffff] focus:ring focus:ring-[#00ffff]/20 transition-all focus:outline-none"
                    placeholder="E.g., neon, cyberpunk, minimalist (comma separated)"
                    value={styleKeywords}
                    onChange={(e) => setStyleKeywords(e.target.value)}
                  />
                </div>
                
                {error && (
                  <div className="p-3 border border-red-500 bg-red-500/10 text-red-400 rounded-md">
                    {error}
                  </div>
                )}
                
                <Button 
                  variant="cyanNeon" 
                  className="w-full py-3" 
                  onClick={handleGenerateAd}
                  disabled={isGenerating || !prompt.trim()}
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
                    "Generate Ad"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Results */}
          <Card variant="cyan" className="backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4 text-[#00ffff]">
                {generatedAd ? "Your Generated Ad" : "Preview"}
              </h3>
              
              <div className="bg-black/50 border-2 border-[#00ffff]/50 rounded-md overflow-hidden aspect-square flex items-center justify-center">
                {generatedAd ? (
                  <img 
                    src={generatedAd.image_url} 
                    alt="Generated viral ad" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="w-24 h-24 mx-auto mb-4 border-2 border-[#00ffff] rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#00ffff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">
                      Your generated ad will appear here.
                      <br />
                      <span className="text-sm text-[#00ffff]/70">Fill out the form and click Generate!</span>
                    </p>
                  </div>
                )}
              </div>
              
              {generatedAd && (
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-black/70 border border-[#00ffff]/30 rounded-md">
                    <h4 className="text-sm font-semibold text-[#00ffff] mb-1">Prompt Used:</h4>
                    <p className="text-gray-300 text-sm">{generatedAd.prompt_used}</p>
                  </div>
                  
                  <div className="flex justify-between gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff]/10"
                      onClick={handleDownload}
                    >
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-[#fe00fe] text-[#fe00fe] hover:bg-[#fe00fe]/10"
                      onClick={() => setGeneratedAd(null)}
                    >
                      New Generation
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Usage tips */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-[#fe00fe] drop-shadow-[0_0_5px_#fe00fe]">
            Tips for Great Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-[#fe00fe]/30 p-4 rounded-md backdrop-blur-sm">
              <h4 className="font-bold mb-2 text-[#00ffff]">Be Specific</h4>
              <p className="text-gray-300 text-sm">Describe the visual elements, colors, and mood you want in your viral ad. The more details, the better!</p>
            </div>
            
            <div className="border border-[#fe00fe]/30 p-4 rounded-md backdrop-blur-sm">
              <h4 className="font-bold mb-2 text-[#00ffff]">Use Keywords</h4>
              <p className="text-gray-300 text-sm">Include popular meme templates and internet trends to make your ad more engaging and relevant.</p>
            </div>
            
            <div className="border border-[#fe00fe]/30 p-4 rounded-md backdrop-blur-sm">
              <h4 className="font-bold mb-2 text-[#00ffff]">Choose the Right Category</h4>
              <p className="text-gray-300 text-sm">Different categories have different visual styles. Match your idea to the appropriate category.</p>
            </div>
            
            <div className="border border-[#fe00fe]/30 p-4 rounded-md backdrop-blur-sm">
              <h4 className="font-bold mb-2 text-[#00ffff]">Add Style Keywords</h4>
              <p className="text-gray-300 text-sm">Style keywords help define the visual aesthetic of your ad. Try combinations like "cyberpunk, neon" or "minimalist, clean".</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViralAdGenerator;
