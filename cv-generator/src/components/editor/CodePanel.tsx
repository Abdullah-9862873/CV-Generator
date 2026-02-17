"use client";

import { useState, useCallback, useMemo } from "react";
import { Copy, RefreshCw, FileCode } from "lucide-react";

interface CodePanelProps {
  html: string;
  css: string;
  onCodeChange: (html: string, css: string) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export default function CodePanel({
  html,
  css,
  onCodeChange,
  onRegenerate,
  isGenerating,
}: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const combinedCode = useMemo(() => {
    if (!css) return html;
    if (/<style[\s\S]*<\/style>/i.test(html)) {
      return html;
    }
    return html.replace(
      /<\/head>/i,
      `<style>\n${css}\n</style>\n</head>`
    );
  }, [html, css]);

  const handleCombinedChange = useCallback(
    (value: string) => {
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/i;
      const match = value.match(styleRegex);
      const extractedCSS = match ? match[1].trim() : "";
      const cleanedHTML = match ? value.replace(styleRegex, "") : value;
      onCodeChange(cleanedHTML, extractedCSS);
    },
    [onCodeChange]
  );

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(combinedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [combinedCode]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-200">Combined Code</span>
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

      <textarea
        value={combinedCode}
        onChange={(e) => handleCombinedChange(e.target.value)}
        className="flex-1 bg-gray-900 text-gray-100 font-mono text-xs leading-relaxed p-4 resize-none focus:outline-none"
        spellCheck={false}
        placeholder={isGenerating ? "Generating CV..." : "No code generated yet"}
        disabled={isGenerating}
      />

      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-500">
        {combinedCode.length} characters
      </div>
    </div>
  );
}
