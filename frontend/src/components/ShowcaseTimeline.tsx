import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/Card";
import { Button } from "../components/Button";
import { formatDistanceToNow } from 'date-fns';
import brain from "brain";

interface ShowcaseItem {
  id: string;
  timestamp: string;
  template_id: string;
  template_name: string;
  template_description: string;
  template_url: string;
  result_url: string;
  likes: number;
  username?: string | null;
  caption?: string | null;
}

interface ShowcaseTimelineProps {
  limit?: number; // Number of items to display
  className?: string;
}

const ShowcaseTimeline: React.FC<ShowcaseTimelineProps> = ({ 
  limit = 5,
  className = ""
}) => {
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingLikes, setLoadingLikes] = useState<Record<string, boolean>>({});
  
  // Load showcase items
  useEffect(() => {
    const loadShowcase = async () => {
      try {
        setIsLoading(true);
        const response = await brain.get_showcase({ limit, offset: 0 });
        const data = await response.json();
        setShowcaseItems(data.items);
      } catch (err) {
        console.error("Error loading showcase:", err);
        setError("Could not load showcase items");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadShowcase();
  }, [limit]);
  
  // Handle like button click
  const handleLike = async (itemId: string) => {
    setLoadingLikes((prev) => ({ ...prev, [itemId]: true }));
    
    try {
      const response = await brain.like_showcase_item({ itemId });
      const data = await response.json();
      
      // Update the likes count in the UI
      setShowcaseItems((prevItems) => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, likes: data.likes } : item
        )
      );
    } catch (err) {
      console.error("Error liking showcase item:", err);
    } finally {
      setLoadingLikes((prev) => ({ ...prev, [itemId]: false }));
    }
  };
  
  if (isLoading) {
    return (
      <div className={`p-8 flex justify-center items-center ${className}`}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#fe00fe]"></div>
        <span className="ml-3 text-gray-400">Loading showcase...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <p className="text-red-500 mb-3">{error}</p>
        <Button 
          variant="neon" 
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
      </div>
    );
  }
  
  if (showcaseItems.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <p className="text-gray-400">No transformations to show yet.</p>
        <p className="text-gray-400 mt-1">Be the first to create one!</p>
      </div>
    );
  }
  
  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {showcaseItems.map((item) => (
          <Card key={item.id} variant="neon" className="overflow-hidden bg-black/80 border border-[#00ffff]/30 hover:border-[#00ffff] transition-all duration-300">
            <div className="relative">
              <img 
                src={item.result_url} 
                alt={`${item.template_name} transformation`}
                className="w-full h-56 object-cover"
              />
              <div className="absolute top-3 right-3">
                <div className="bg-black/70 text-[#00ffff] border border-[#00ffff]/50 px-2 py-1 rounded-full text-xs">
                  {item.template_name}
                </div>
              </div>
              {item.username && (
                <div className="absolute bottom-3 left-3">
                  <div className="bg-black/70 text-white border border-white/20 px-2 py-1 rounded-full text-xs">
                    @{item.username}
                  </div>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              {item.caption && (
                <p className="text-white/90 mb-3 italic">"{item.caption}"</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="hover:bg-[#fe00fe]/10 text-[#fe00fe] group"
                  onClick={() => handleLike(item.id)}
                  disabled={loadingLikes[item.id]}
                >
                  <svg
                    className="h-4 w-4 mr-1 group-hover:text-[#fe00fe] transition-colors"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span>{item.likes}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export { ShowcaseTimeline };
