"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Copy, RefreshCw, FileCode } from "lucide-react";

interface CodePanelProps {
  html: string;
  css: string;
  onCodeChange: (html: string, css: string) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

type TabType = "html" | "css" | "combined";

export default function CodePanel({
  html,
  css,
  onCodeChange,
  onRegenerate,
  isGenerating,
}: CodePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("combined");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getCombinedCode = useCallback(() => {
    if (css) {
      const cssTag = `<style>\n${css}\n</style>`;
      return html.replace(/<\/head>/i, `${cssTag}\n</head>`);
    }
    return html;
  }, [html, css]);

  const getCurrentContent = useCallback(() => {
    switch (activeTab) {
      case "html":
        return html;
      case "css":
        return css;
      case "combined":
        return getCombinedCode();
      default:
        return html;
    }
  }, [activeTab, html, css, getCombinedCode]);

  const handleContentChange = useCallback(
    (value: string) => {
      if (activeTab === "html" || activeTab === "combined") {
        if (activeTab === "combined") {
          const cssMatch = value.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
          const extractedCSS = cssMatch ? cssMatch[1].trim() : "";
          let extractedHTML = value;
          if (cssMatch) {
            extractedHTML = value.replace(/<style[^>]*>[\s\S]*?<\/style>/i, "");
          }
          onCodeChange(extractedHTML, extractedCSS);
        } else {
          onCodeChange(value, css);
        }
      } else if (activeTab === "css") {
        onCodeChange(html, value);
      }
    },
    [activeTab, html, css, onCodeChange]
  );

  const handleCopy = useCallback(async () => {
    const content = getCurrentContent();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getCurrentContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-200">Code Editor</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <span className="text-xs text-green-400">Copied!</span>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
            title="Regenerate with AI"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab("html")}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === "html"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          HTML
        </button>
        <button
          onClick={() => setActiveTab("css")}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === "css"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          CSS
        </button>
        <button
          onClick={() => setActiveTab("combined")}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === "combined"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Combined
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={getCurrentContent()}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-xs leading-relaxed resize-none focus:outline-none"
          spellCheck={false}
          placeholder={isGenerating ? "Generating CV..." : "No code generated yet"}
          disabled={isGenerating}
        />
      </div>

      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
        <span className="text-xs text-gray-500">
          {activeTab === "combined"
            ? `${getCurrentContent().length} characters`
            : activeTab === "html"
            ? `${html.length} characters`
            : `${css.length} characters`}
        </span>
      </div>
    </div>
  );
}
