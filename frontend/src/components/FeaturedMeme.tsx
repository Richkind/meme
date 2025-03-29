import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../components/Card";
import brain from "brain";

interface FeaturedMemeProps {
  className?: string;
  autoChangeInterval?: number; // Time in ms between auto-changing images
}

export const FeaturedMeme: React.FC<FeaturedMemeProps> = ({
  className = "",
  autoChangeInterval = 7000, // Default: change every 7 seconds
}) => {
  const [topMemes, setTopMemes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load top memes
  useEffect(() => {
    const fetchTopMemes = async () => {
      try {
        setIsLoading(true);
        // Get showcase items and sort by likes
        const response = await brain.get_showcase({ limit: 20, offset: 0 });
        const data = await response.json();
        
        // Sort by most likes
        const sortedMemes = [...data.items].sort((a, b) => b.likes - a.likes);
        setTopMemes(sortedMemes.slice(0, 10)); // Take top 10
      } catch (err) {
        console.error("Error loading top memes:", err);
        setError("Could not load featured memes");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopMemes();
  }, []);

  // Auto-rotation effect
  useEffect(() => {
    if (topMemes.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === topMemes.length - 1 ? 0 : prevIndex + 1
      );
    }, autoChangeInterval);
    
    return () => clearInterval(interval);
  }, [topMemes, autoChangeInterval]);

  if (isLoading) {
    return (
      <Card className={`overflow-hidden relative ${className}`} variant="neon">
        <CardContent className="p-0 aspect-[3/4] flex items-center justify-center bg-black/40">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#fe00fe]"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || topMemes.length === 0) {
    return (
      <Card className={`overflow-hidden relative ${className}`} variant="neon">
        <CardContent className="p-0 aspect-[3/4] flex items-center justify-center bg-black/40">
          <p className="text-gray-400 p-4 text-center">
            {error || "No featured memes yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentMeme = topMemes[currentIndex];

  return (
    <Card className={`overflow-hidden relative ${className}`} variant="neon">
      <CardContent className="p-0 aspect-[3/4]">
        {/* Current meme image */}
        <img 
          src={currentMeme.result_url} 
          alt={`${currentMeme.template_name} transformation`}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3 text-center">
          <p className="text-[#00ffff] font-bold">
            {currentMeme.template_name}
          </p>
          {currentMeme.caption && (
            <p className="text-white text-sm mt-1 italic">
              "{currentMeme.caption}"
            </p>
          )}
          <div className="flex items-center justify-center mt-2 text-pink-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span className="ml-1">{currentMeme.likes}</span>
          </div>
        </div>
        
        {/* Pagination dots */}
        <div className="absolute bottom-24 left-0 right-0 flex justify-center space-x-1">
          {topMemes.slice(0, 5).map((_, index) => (
            <div 
              key={index}
              className={`h-2 w-2 rounded-full ${index === currentIndex ? 'bg-[#fe00fe]' : 'bg-gray-400/50'}`} 
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
