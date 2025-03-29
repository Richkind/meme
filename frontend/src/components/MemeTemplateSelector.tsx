import React from "react";
import { cn } from "../utils/utils";
import { Card } from "./Card";

interface MemeTemplateProps {
  templates: Record<string, {
    name: string;
    description?: string;
    url: string;
  }>;
  selectedTemplate: string | null;
  onSelect: (templateId: string) => void;
  disabled?: boolean;
  className?: string;
}

export const MemeTemplateSelector: React.FC<MemeTemplateProps> = ({
  templates,
  selectedTemplate,
  onSelect,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={cn("grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4", className)}>
      {Object.entries(templates).map(([id, template]) => (
        <div key={id} className="relative">
          <Card
            variant={selectedTemplate === id ? "neon" : "default"}
            className={cn(
              "cursor-pointer overflow-hidden transition-all transform hover:scale-105 bg-black",
              {
                "opacity-50": disabled,
                "border-2 border-[#fe00fe] shadow-[0_0_15px_#fe00fe]": selectedTemplate === id,
                "border border-gray-700 hover:border-[#fe00fe] hover:shadow-[0_0_8px_#fe00fe]": selectedTemplate !== id,
              }
            )}
            onClick={() => !disabled && onSelect(id)}
          >
            <div className="relative h-36 sm:h-32 overflow-hidden">
              <img
                src={template.url}
                alt={template.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
              <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                <p className={cn(
                  "font-bold text-sm",
                  { "text-[#fe00fe] drop-shadow-[0_0_3px_#fe00fe]": selectedTemplate === id }
                )}>
                  {template.name}
                </p>
                {template.description && (
                  <p className="text-xs text-gray-200 opacity-80 line-clamp-1">{template.description}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
};
