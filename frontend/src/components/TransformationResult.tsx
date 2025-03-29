import React, { useState } from "react";
import { Button } from "./Button";
import { trackDownload, trackShare } from "../utils/analytics";

// Type for model information
type ModelInfo = {
  imageModel: string;
  textModel: string;
};

interface TransformationResultProps {
  caption?: string | null;
  alternativeCaptions?: string[];
  onSelectAlternative?: (caption: string) => void;
  originalImage: string;
  transformedImage: string;
  onNewTransformation?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  templateId?: string;
  modelInfo?: ModelInfo;
}

const TransformationResult: React.FC<TransformationResultProps> = ({
  originalImage,
  transformedImage,
  onNewTransformation,
  isLoading = false,
  error = null,
  className = "",
  templateId,
  caption,
  alternativeCaptions = [],
  onSelectAlternative,
  modelInfo,
}) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    // Track download event
    if (templateId) {
      trackDownload(templateId);
    }

    const link = document.createElement("a");
    link.href = transformedImage;
    link.download = "memeswap-transformation.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch(transformedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy image: ", err);
    }
  };

  const handleShare = async (platform: string) => {
    // Track share event
    if (templateId) {
      trackShare(templateId, platform);
    }

    const shareUrl = transformedImage;
    const shareText = "Check out my viral meme transformation with MemeSwap!";

    // In a real app, we'd have actual share URLs
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(window.location.href)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        window.location.href
      )}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(
        window.location.href
      )}&text=${encodeURIComponent(shareText)}`,
    };

    if (platform in shareUrls) {
      window.open(shareUrls[platform as keyof typeof shareUrls], "_blank");
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: "My Viral Meme Transformation",
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing: ", err);
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#fe00fe] rounded-lg bg-black/30 backdrop-blur-sm min-h-[400px]">
          <div className="w-16 h-16 border-4 border-t-transparent border-[#00ffff] rounded-full animate-spin mb-4"></div>
          <p className="text-[#00ffff] text-xl font-bold animate-pulse">
            Transforming your image...
          </p>
          <p className="text-gray-400 text-sm mt-2">
            This may take a few moments
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-red-500 rounded-lg bg-black/30 backdrop-blur-sm min-h-[400px]">
          <div className="w-16 h-16 text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-red-500 text-xl font-bold mb-2">
            Transformation Failed
          </p>
          <p className="text-gray-400 text-center mb-6">{error}</p>
          {onNewTransformation && (
            <Button variant="neon" onClick={onNewTransformation}>
              Try Again
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* AI-generated caption display */}
          {caption && (
            <div className="mb-4 p-4 bg-gradient-to-r from-[#00ffff]/10 to-[#fe00fe]/10 border border-[#00ffff] rounded-lg">
              <h3 className="text-[#00ffff] font-bold mb-2 drop-shadow-[0_0_3px_#00ffff]">AI-Generated Caption</h3>
              <p className="text-white text-xl font-bold mb-2">"{caption}"</p>
              
              {alternativeCaptions.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-[#fe00fe] text-sm font-bold mb-2 drop-shadow-[0_0_3px_#fe00fe]">Alternative Captions:</h4>
                  <div className="space-y-2">
                    {alternativeCaptions.map((alt, index) => (
                      <div 
                        key={index}
                        className="p-2 border border-[#fe00fe]/50 rounded cursor-pointer hover:bg-[#fe00fe]/10 transition-colors"
                        onClick={() => onSelectAlternative && onSelectAlternative(alt)}
                      >
                        <p className="text-white">"{alt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Before & After Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#00ffff]">
                Original
              </h3>
              <div className="relative rounded-lg overflow-hidden border-2 border-[#00ffff] shadow-[0_0_10px_#00ffff]">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#fe00fe]">
                Transformed
              </h3>
              <div className="relative rounded-lg overflow-hidden border-2 border-[#fe00fe] shadow-[0_0_10px_#fe00fe]">
                <img
                  src={transformedImage}
                  alt="Transformed"
                  className="w-full h-auto object-contain"
                />
                <div className="absolute bottom-0 inset-x-0 p-2 bg-black/80 backdrop-blur-sm">
                  <p className="text-xs text-center text-gray-400">
                    Your personalized viral meme
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Model Information */}
          {modelInfo && (modelInfo.imageModel || modelInfo.textModel) && (
            <div className="mt-4 p-3 bg-black/40 border border-[#00ffff]/30 rounded-md">
              <h4 className="text-sm font-medium text-[#00ffff] mb-1">AI Models Used</h4>
              <div className="flex flex-wrap gap-2">
                {modelInfo.imageModel && (
                  <div className="px-2 py-1 bg-black/60 border border-[#fe00fe]/30 rounded text-xs">
                    <span className="text-[#fe00fe] font-medium">Image:</span>{" "}
                    <span className="text-gray-300">{modelInfo.imageModel}</span>
                  </div>
                )}
                {modelInfo.textModel && (
                  <div className="px-2 py-1 bg-black/60 border border-[#00ffff]/30 rounded text-xs">
                    <span className="text-[#00ffff] font-medium">Text:</span>{" "}
                    <span className="text-gray-300">{modelInfo.textModel}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-[#fe00fe]/30 pt-6 space-y-6">
            <h3 className="text-xl font-semibold text-[#00ffff]">
              Share Your Creation
            </h3>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button variant="neon" onClick={handleDownload}>
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </span>
              </Button>

              <Button
                variant="cyanNeon"
                onClick={handleCopyToClipboard}
                className="group"
              >
                <span className="flex items-center gap-2">
                  {copied ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Image
                    </>
                  )}
                </span>
              </Button>
            </div>

            <div className="border-t border-[#fe00fe]/30 pt-6">
              <h4 className="text-lg font-semibold text-[#fe00fe] mb-4">
                Share on Social Media
              </h4>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {/* Twitter/X */}
                <Button
                  variant="neon"
                  size="sm"
                  onClick={() => handleShare("twitter")}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Twitter/X
                  </span>
                </Button>

                {/* Facebook */}
                <Button
                  variant="cyanNeon"
                  size="sm"
                  onClick={() => handleShare("facebook")}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
                    </svg>
                    Facebook
                  </span>
                </Button>

                {/* Telegram */}
                <Button
                  variant="neon"
                  size="sm"
                  onClick={() => handleShare("telegram")}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-3.11-8.83l.013-.007.87 2.87c.112.311.266.367.453.341.188-.025.287-.126.41-.244l1.188-1.148 2.55 1.888c.466.257.801.124.917-.432l1.657-7.822c.183-.728-.137-1.02-.702-.788l-9.733 3.76c-.664.266-.66.638-.12.803l2.497 0.78z" />
                    </svg>
                    Telegram
                  </span>
                </Button>

                {/* Native Share (if available) */}
                {navigator.share && (
                  <Button
                    variant="cyanNeon"
                    size="sm"
                    onClick={() => handleShare("native")}
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      Share
                    </span>
                  </Button>
                )}
              </div>
            </div>

            {onNewTransformation && (
              <div className="border-t border-[#00ffff]/30 pt-6 flex justify-center">
                <Button
                  variant="neon"
                  size="lg"
                  onClick={onNewTransformation}
                >
                  Create Another Transformation
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { TransformationResult };
