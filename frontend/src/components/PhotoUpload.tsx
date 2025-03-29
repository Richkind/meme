import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./Button";

interface PhotoUploadProps {
  onUpload?: (file: File) => void;
  maxSizeMB?: number;
  className?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onUpload,
  maxSizeMB = 5,
  className = "",
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      setIsSuccess(false);
      
      if (acceptedFiles.length === 0) {
        return;
      }

      const selectedFile = acceptedFiles[0];

      // Validate file size
      if (selectedFile.size > maxSize) {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB`);
        return;
      }

      // Create preview
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setFile(selectedFile);

      // Call onUpload handler if provided
      if (onUpload) {
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          onUpload(selectedFile);
          setIsUploading(false);
          setIsSuccess(true);
        }, 1500);
      }

      // Clean up preview URL when component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    },
    [maxSize, maxSizeMB, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': []
    },
    maxFiles: 1,
  });

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setIsSuccess(false);
  };

  const getBorderColor = () => {
    if (isDragReject || error) return "border-red-500 shadow-[0_0_15px_#ff0000]";
    if (isSuccess) return "border-green-500 shadow-[0_0_15px_#00ff00]";
    if (isDragActive) return "border-[#00ffff] shadow-[0_0_20px_#00ffff]";
    return "border-[#fe00fe] shadow-[0_0_10px_#fe00fe]";
  };

  return (
    <div className={`w-full ${className}`}>
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            relative w-full p-6 border-2 border-dashed rounded-lg cursor-pointer
            transition-all duration-300 flex flex-col items-center justify-center
            min-h-[300px] bg-black/30 backdrop-blur-sm
            ${getBorderColor()}
            hover:shadow-[0_0_20px_#fe00fe]
          `}
        >
          <input {...getInputProps()} data-testid="file-input" />

          {/* Upload Icon */}
          <div className="mb-4 text-[#fe00fe]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Text Content */}
          <div className="text-center">
            <p className="text-xl font-medium text-[#00ffff] mb-1">
              {isDragActive
                ? "Drop your image here"
                : "Drag & drop your image here"}
            </p>
            <p className="text-sm font-medium text-gray-400 mb-4">
              or click to select a file
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: JPEG, PNG, GIF, WEBP
              <br />
              Max size: {maxSizeMB}MB
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 text-red-500 text-sm font-medium">{error}</div>
          )}
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border-2 border-[#fe00fe] shadow-[0_0_15px_#fe00fe]">
          {/* Preview Image */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto object-contain max-h-[500px]"
          />

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="animate-pulse text-[#00ffff] text-xl font-bold">
                Processing...
              </div>
            </div>
          )}

          {/* Success Indicator */}
          {isSuccess && (
            <div className="absolute top-4 right-4 bg-black/70 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-400">
              Upload successful
            </div>
          )}

          {/* Actions */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-black/70 backdrop-blur-sm flex justify-between items-center">
            <div className="text-sm text-white">
              {file?.name} ({(file?.size / (1024 * 1024)).toFixed(2)}MB)
            </div>
            <Button variant="cyanNeon" size="sm" onClick={handleReset}>
              Change Photo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};


