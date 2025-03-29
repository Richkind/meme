import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import brain from "brain";
import { API_URL } from "app";

interface Template {
  name: string;
  description: string;
  url: string;
  template_id?: string;
  prompt?: string;
  created_at?: string;
  updated_at?: string;
}

interface TemplateManagerProps {
  adminPassword: string;
}

export function TemplateManager({ adminPassword }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state for adding/editing templates
  const [isAddMode, setIsAddMode] = useState(true);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateIdInput, setTemplateIdInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await brain.list_templates({ password: adminPassword });
      const data = await response.json();
      setTemplates(data.templates || {});
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setIsAddMode(true);
    setCurrentTemplateId(null);
    setName("");
    setDescription("");
    setPrompt("");
    setSelectedFile(null);
    setTemplateIdInput("");
    setSelectedTemplateId(null);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleEditTemplate = (templateId: string) => {
    const template = templates[templateId];
    if (template) {
      setIsAddMode(false);
      setCurrentTemplateId(templateId);
      setName(template.name || "");
      setDescription(template.description || "");
      setPrompt(template.prompt || "");
      setSelectedFile(null); // Reset file selection
      
      // Scroll to the top of the form for better UX
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Log for debugging
      console.log(`Editing template: ${templateId}`, template);
    }
  };
  
  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!name || !description) {
      setError("Name and description are required.");
      return;
    }
    
    if (isAddMode && !selectedFile) {
      setError("Please select an image file.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isAddMode) {
        // Adding a new template
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("password", adminPassword);
        
        if (prompt) {
          formData.append("prompt", prompt);
        } else {
          formData.append("prompt", ""); // Send empty string to ensure consistent format
        }
        
        if (selectedFile) {
          formData.append("image", selectedFile);
        }
        
        if (templateIdInput) {
          formData.append("template_id", templateIdInput);
        }
        
        // Use fetch directly to ensure proper multipart form data handling
        const response = await fetch(`${API_URL}/templates/add`, {
          method: "POST",
          body: formData,
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
          } catch (e) {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setSuccess(`Template '${name}' added successfully!`);
        resetForm();
      } else {
        // Updating an existing template
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("password", adminPassword);
        
        if (prompt) {
          formData.append("prompt", prompt);
        } else {
          formData.append("prompt", ""); // Send empty string to ensure consistent format
        }
        
        if (selectedFile) {
          formData.append("image", selectedFile);
        }
        
        // Use fetch directly to ensure proper multipart form data handling
        const response = await fetch(`${API_URL}/templates/update/${currentTemplateId}`, {
          method: "PUT",
          body: formData,
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
          } catch (e) {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setSuccess(`Template '${name}' updated successfully!`);
        resetForm();
      }
      
      // Refresh templates list
      fetchTemplates();
    } catch (err) {
      console.error("Error processing template:", err);
      setError(`Failed to ${isAddMode ? "add" : "update"} template. ${err instanceof Error ? err.message : ""}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm(`Are you sure you want to delete the template '${templates[templateId]?.name}'?`)) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Use fetch directly to ensure proper handling
      const response = await fetch(`${API_URL}/templates/delete/${templateId}?password=${encodeURIComponent(adminPassword)}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setSuccess(`Template '${templates[templateId]?.name}' deleted successfully!`);
      
      // Refresh templates list
      fetchTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
      setError(`Failed to delete template. ${err instanceof Error ? err.message : ""}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Form Card */}
      <Card variant="neon" className="bg-black/80">
        <CardHeader>
          <CardTitle className="text-[#fe00fe]">
            {isAddMode ? "Add New Template" : "Edit Template"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTemplate} className="space-y-4" id="template-form">
            {isAddMode && (
              <div>
                <label htmlFor="template_id" className="block text-sm font-medium text-[#00ffff] mb-1">
                  Template ID (optional - will be generated from name if empty)
                </label>
                <input
                  id="template_id"
                  type="text"
                  value={templateIdInput}
                  onChange={(e) => setTemplateIdInput(e.target.value)}
                  className="w-full p-2 border-2 border-[#fe00fe] bg-black/60 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent"
                  placeholder="e.g., btc_laser_eyes"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#00ffff] mb-1">
                Template Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2 border-2 border-[#fe00fe] bg-black/60 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent"
                placeholder="e.g., Laser Eyes"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#00ffff] mb-1">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full p-2 border-2 border-[#fe00fe] bg-black/60 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent"
                placeholder="Describe what this template does"
              />
            </div>
            
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-[#00ffff] mb-1">
                AI Prompt (optional)
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                className="w-full p-2 border-2 border-[#fe00fe] bg-black/60 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent"
                placeholder="AI prompt for image generation"
              />
            </div>
            
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-[#00ffff] mb-1">
                Template Image {isAddMode ? "*" : "(leave empty to keep current image)"}
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 border-2 border-[#fe00fe] bg-black/60 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#fe00fe] file:text-black hover:file:bg-[#fe00fe]/90"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-500 rounded-md">
                <p className="text-red-500">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-900/50 border border-green-500 rounded-md">
                <p className="text-green-500">{success}</p>
              </div>
            )}
            
            <div className="flex gap-4">
              <Button
                type="submit"
                variant="cyanNeon"
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? "Processing..." : isAddMode ? "Add Template" : "Update Template"}
              </Button>
              
              {!isAddMode && (
                <Button
                  type="button"
                  variant="neon"
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Templates List */}
      <Card variant="cyan" className="bg-black/80">
        <CardHeader>
          <CardTitle className="text-[#00ffff]">
            Manage Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-12 h-12 border-4 border-t-transparent border-[#00ffff] rounded-full animate-spin"></div>
            </div>
          ) : Object.keys(templates).length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(templates).map(([templateId, template]) => (
                  <div 
                    key={templateId} 
                    className="flex flex-col md:flex-row gap-4 p-4 border border-[#fe00fe]/30 rounded-lg bg-black/40 hover:bg-black/60 transition-colors"
                  >
                    <div className="w-full md:w-24 h-24 overflow-hidden rounded-md flex-shrink-0">
                      {template.url && (
                        <img 
                          src={template.url} 
                          alt={template.name} 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#fe00fe]">{template.name}</h3>
                      <p className="text-gray-300 text-sm mb-2">{template.description}</p>
                      <p className="text-gray-400 text-xs">
                        ID: <span className="text-[#00ffff]">{templateId}</span>
                      </p>
                      {template.prompt && (
                        <p className="text-gray-400 text-xs mt-1">
                          Prompt: <span className="text-[#00ffff]">{template.prompt}</span>
                        </p>
                      )}
                      {template.created_at && (
                        <p className="text-gray-400 text-xs mt-1">
                          Created: <span className="text-[#00ffff]">{new Date(template.created_at).toLocaleString()}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 justify-end">
                      <Button
                        variant="cyanNeon"
                        size="sm"
                        onClick={() => handleEditTemplate(templateId)}
                      >
                        Edit
                      </Button>
                      
                      <Button
                        variant="neon"
                        size="sm"
                        onClick={() => handleDeleteTemplate(templateId)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="cyanNeon" 
                onClick={fetchTemplates}
                className="mt-4"
              >
                Refresh Templates
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-[#fe00fe]/30 rounded-lg">
              <p className="text-gray-400 mb-4">No templates found</p>
              <Button variant="cyanNeon" onClick={fetchTemplates}>
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
