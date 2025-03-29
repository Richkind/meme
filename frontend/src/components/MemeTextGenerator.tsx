import React, { useState } from "react";
import { Button } from "./Button";
import brain from "brain";

interface MemeTextGeneratorProps {
  templateId: string | null;
  onCaptionGenerated?: (caption: string) => void;
  className?: string;
}

const MemeTextGenerator: React.FC<MemeTextGeneratorProps> = ({
  templateId,
  onCaptionGenerated,
  className = "",
}) => {
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [captions, setCaptions] = useState<{main: string, alternatives: string[]}>({main: "", alternatives: []});
  const [error, setError] = useState<string | null>(null);

  const generateCaption = async () => {
    if (!templateId) {
      setError("Please select a template first");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Call OpenAI API directly using brain client
      const response = await brain.generate_meme_text({
        template_id: templateId,
        prompt: prompt || undefined,
        style: "funny",
      });

      if (!response.ok) {
        throw new Error("Failed to generate caption");
      }

      const data = await response.json();
      setCaptions({
        main: data.caption,
        alternatives: data.alternative_captions || [],
      });

      // Notify parent component if callback provided
      if (onCaptionGenerated && data.caption) {
        onCaptionGenerated(data.caption);
      }
    } catch (err) {
      console.error("Error generating caption:", err);
      setError("Failed to generate caption. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCaption = (caption: string) => {
    setCaptions(prev => ({
      ...prev,
      main: caption,
    }));

    if (onCaptionGenerated) {
      onCaptionGenerated(caption);
    }
  };

  return (
    <div className={`${className} p-3 sm:p-4 border-2 border-[#00ffff] rounded-lg bg-black/40 backdrop-blur-sm`}>
      <h3 className="text-[#00ffff] text-lg sm:text-xl font-bold mb-3 sm:mb-4 drop-shadow-[0_0_3px_#00ffff]">
        Generate Meme Caption with AI
      </h3>

      <div className="mb-4">
        <label className="block text-[#00ffff] text-sm font-medium mb-2">
          Prompt (Optional)
        </label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., 'when someone posts a selfie' or 'reaction to trending news'"
          className="w-full p-2 sm:p-3 bg-black border-2 border-[#fe00fe] rounded text-white focus:ring-[#fe00fe] focus:border-[#fe00fe] placeholder-gray-500"
        />
        <p className="text-gray-400 text-xs mt-1">
          Leave empty for a random viral meme caption
        </p>
      </div>

      <div className="mb-4">
        <Button
          variant="neon"
          onClick={generateCaption}
          disabled={isGenerating || !templateId}
          className="w-full"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#fe00fe]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Caption"
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg mb-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {captions.main && (
        <div className="mt-4">
          <h4 className="text-[#fe00fe] text-lg font-bold mb-2 drop-shadow-[0_0_3px_#fe00fe]">
            Generated Caption:
          </h4>
          <div className="p-3 border-2 border-[#fe00fe] rounded-lg bg-black mb-3">
            <p className="text-white text-base sm:text-lg font-bold">"{captions.main}"</p>
          </div>

          {captions.alternatives.length > 0 && (
            <div>
              <h5 className="text-[#00ffff] text-sm font-bold mb-2">
                Alternative Options:
              </h5>
              <div className="space-y-2">
                {captions.alternatives.map((alt, index) => (
                  <div
                    key={index}
                    className="p-2 border border-[#00ffff]/50 rounded cursor-pointer hover:bg-[#00ffff]/10 transition-colors"
                    onClick={() => handleSelectCaption(alt)}
                  >
                    <p className="text-white">"{alt}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { MemeTextGenerator };
