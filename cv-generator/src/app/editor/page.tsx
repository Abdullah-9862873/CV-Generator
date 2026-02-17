"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, AlertCircle } from "lucide-react";
import SplitEditor from "@/components/editor/SplitEditor";
import { useAppStore, useGeneratedCV, useIsGenerating } from "@/hooks/useAppStore";
import { regenerateCV } from "@/lib/services/cvProcessor";

export default function EditorPage() {
  const router = useRouter();
  const [isProcessing] = useState(false);
  const [progress] = useState({ stage: "", progress: 0, message: "" });
  const [error] = useState<string | null>(null);
  
  const generatedCV = useGeneratedCV();
  const isGenerating = useIsGenerating();
  const { uploadState, setGeneratedCV, setIsGenerating, setGenerationError } = useAppStore();
  
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");

  useEffect(() => {
    if (generatedCV) {
      setHtml(generatedCV.html);
      setCss(generatedCV.css);
    }
  }, [generatedCV]);

  const handleRegenerate = useCallback(async () => {
    if (!generatedCV) return;
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const result = await regenerateCV(
        generatedCV.text,
        generatedCV.colorPalette,
        generatedCV.layout,
        generatedCV.blocks
      );
      
      setGeneratedCV({
        ...generatedCV,
        html: result.html,
        css: result.css,
      });
      
      setHtml(result.html);
      setCss(result.css);
      
    } catch (err) {
      console.error("Regeneration error:", err);
      setGenerationError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setIsGenerating(false);
    }
  }, [generatedCV, setGeneratedCV, setIsGenerating, setGenerationError]);

  if (!uploadState.file && !generatedCV) {
    return (
      <div className="container mx-auto px-4 py-12">
        <button
          onClick={() => router.push("/upload")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Upload
        </button>
        
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No CV to Edit</h1>
          <p className="text-gray-600 mb-8">
            Please upload a CV image or document first to start editing.
          </p>
          <button
            onClick={() => router.push("/upload")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload CV
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/upload")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">New Upload</span>
            </button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <h1 className="text-lg font-semibold text-gray-900">CV Editor</h1>
            
            {isGenerating && (
              <span className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Regenerating...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {uploadState.file?.name || "Uploaded CV"}
            </span>
          </div>
        </div>
        
        {isProcessing && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{progress.message}</span>
              <span className="text-gray-500">{progress.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </header>
      
      <main className="flex-1 min-h-0 overflow-hidden">
        <SplitEditor
          initialHtml={html}
          initialCss={css}
          onRegenerate={handleRegenerate}
          isGenerating={isGenerating || isProcessing}
        />
      </main>
    </div>
  );
}
