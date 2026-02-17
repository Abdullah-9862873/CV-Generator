"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Sparkles,
  AlertCircle,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  RefreshCw,
  ArrowLeft
} from "lucide-react";

import { DropZone } from "@/components/upload/DropZone";
import { ImagePreview } from "@/components/upload/ImagePreview";
import { UploadProgress } from "@/components/upload/UploadProgress";
import type { OCRServiceResult } from "@/lib/services/ocrService";
import { getFileType, getFileTypeDescription } from "@/lib/services/documentService";
import { useAppStore } from "@/hooks/useAppStore";

interface DocumentParseResult {
  fullText: string;
  pageCount: number;
  processingTime: number;
  fileName: string;
  fileType: "pdf" | "docx";
  success: boolean;
  error?: string;
}

type PageState =
  | "idle"
  | "preview"
  | "processing"
  | "completed"
  | "error";

export default function UploadPage() {
  const router = useRouter();
  const { uploadState, setUploadState, resetUpload } = useAppStore();

  const [pageState, setPageState] = useState<PageState>("idle");
  const [ocrResult, setOcrResult] = useState<OCRServiceResult | null>(null);

  const [, setDocumentResult] = useState<DocumentParseResult | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fileType, setFileType] = useState<string>("image");

  useEffect(() => {
    if (uploadState.file && uploadState.preview) {
      setPageState("preview");
      const type = getFileType(uploadState.file);
      setFileType(type || "image");
    } else if (uploadState.file) {
      setPageState("preview");
      const type = getFileType(uploadState.file);
      setFileType(type || "image");
    }
  }, [uploadState.file, uploadState.preview]);

  const handleFileSelect = useCallback((file: File) => {
    const fileType = getFileType(file);
    const preview = fileType === "image" ? URL.createObjectURL(file) : null;

    setUploadState({
      file,
      preview,
      isUploading: false,
      progress: 0,
      error: null,
    });

    setPageState("preview");
    setFileType(fileType || "image");
    setErrorMessage("");
  }, [setUploadState]);

  const handleRemoveImage = useCallback(() => {
    if (uploadState.preview) {
      URL.revokeObjectURL(uploadState.preview);
    }

    resetUpload();
    setPageState("idle");
    setOcrResult(null);
    setDocumentResult(null);
    setOcrProgress(0);
    setOcrStatus("");
    setErrorMessage("");
    setFileType("image");
  }, [uploadState.preview, resetUpload]);

  const handleExtractText = useCallback(async () => {
    if (!uploadState.file) {
      setErrorMessage("No file selected. Please upload a file first.");
      setPageState("error");
      return;
    }

    setPageState("processing");
    setOcrProgress(0);
    setOcrStatus("Analyzing file...");

    try {
      const type = getFileType(uploadState.file);

      if (type === "image") {
        setOcrStatus("Initializing OCR engine for image...");

        const { performOCR } = await import("@/lib/services/ocrService");

        const result = await performOCR(uploadState.file, {
          logger: (progress) => {
            setOcrProgress(progress.progress);
            setOcrStatus(progress.status);
          },
        });

        setOcrResult(result);
        setDocumentResult(null);
        setPageState("completed");
      } else {
        setOcrStatus("Loading document parser...");

        const { parseDocument } = await import("@/lib/services/documentService");

        setOcrStatus("Parsing document...");

        const result = await parseDocument(uploadState.file, {
          onProgress: (progress) => {
            setOcrProgress(progress.progress);
            setOcrStatus(progress.status);
          },
        });

        if (result.success) {
          const mockResult: OCRServiceResult = {
            fullText: result.fullText,
            confidence: 100,
            blocks: result.fullText.split("\n\n").map((text) => ({
              text,
              confidence: 100,
              bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
            })),
            processingTime: result.processingTime,
          };

          setDocumentResult(result);
          setOcrResult(mockResult);
          setPageState("completed");
        } else {
          throw new Error(result.error || "Failed to parse document");
        }
      }

    } catch (error) {
      console.error("Processing Error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to extract text. Please try again."
      );
      setPageState("error");
    }
  }, [uploadState.file]);

  const handleGoToEditor = useCallback(async () => {
    if (!uploadState.file) return;
    
    setPageState("processing");
    setOcrProgress(0);
    setOcrStatus("Generating editable CV...");
    
    try {
      const { processCVFromImage } = await import("@/lib/services/cvProcessor");
      const store = await import("@/hooks/useAppStore");
      
      const result = await processCVFromImage(uploadState.file, (progress) => {
        setOcrProgress(progress.progress);
        setOcrStatus(progress.message);
      });
      
      store.useAppStore.getState().setGeneratedCV({
        html: result.html,
        css: result.css,
        text: result.text,
        colorPalette: result.colorPalette,
        layout: result.layout,
        blocks: result.blocks,
      });
      
      router.push("/editor");
    } catch (error) {
      console.error("CV Generation Error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to generate editable CV. Please try again."
      );
      setPageState("error");
    }
  }, [uploadState.file, router]);

  const handleCancelProcessing = useCallback(() => {
    setPageState("preview");
    setOcrProgress(0);
    setOcrStatus("");
  }, []);

  const renderContent = () => {
    switch (pageState) {
      case "idle":
        return (
          <div className="animate-fade-in-up space-y-8">
            <DropZone onFileSelect={handleFileSelect} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FeatureCard
                icon={<Zap className="h-5 w-5" />}
                title="Lightning Fast"
                description="Extract text in seconds with AI-powered OCR"
                color="yellow"
              />
              <FeatureCard
                icon={<Shield className="h-5 w-5" />}
                title="100% Private"
                description="All processing happens in your browser"
                color="green"
              />
              <FeatureCard
                icon={<Clock className="h-5 w-5" />}
                title="Always Free"
                description="No credit card required, no limits"
                color="blue"
              />
            </div>
          </div>
        );

      case "preview":
        return (
          <div className="animate-fade-in-up space-y-6">
            <ImagePreview
              file={uploadState.file!}
              preview={uploadState.preview!}
              onRemove={handleRemoveImage}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleExtractText}
                className="flex-1 btn btn-primary py-4 text-base shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
              >
                <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                {fileType === "image" ? "Extract Text with AI" : "Extract Text"}
              </button>
              <button
                onClick={handleRemoveImage}
                className="btn btn-outline py-4 text-base"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Choose Different File
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                {getFileTypeDescription(uploadState.file!)}
              </span>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Pro Tips for Best Results
              </h4>
              <ul className="text-sm text-blue-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  Ensure the image is clear and well-lit
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  Text should be readable and not blurry
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  Processing typically takes 5-15 seconds
                </li>
              </ul>
            </div>
          </div>
        );

      case "processing":
        return (
          <UploadProgress
            progress={ocrProgress}
            status={ocrStatus || "Processing image..."}
            state="processing"
            onCancel={handleCancelProcessing}
          />
        );

      case "completed":
        return (
          <div className="animate-fade-in-up space-y-6">
            <UploadProgress
              progress={100}
              status="Extraction Complete!"
              state="completed"
            />

            {ocrResult && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Extraction Results
                  </h3>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatBox
                      label="Confidence"
                      value={`${ocrResult.confidence}%`}
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      color={ocrResult.confidence > 80 ? "green" : "yellow"}
                    />
                    <StatBox
                      label="Text Blocks"
                      value={ocrResult.blocks.length.toString()}
                      icon={<FileText className="h-4 w-4" />}
                      color="blue"
                    />
                    <StatBox
                      label="Processing"
                      value={`${(ocrResult.processingTime / 1000).toFixed(1)}s`}
                      icon={<Clock className="h-4 w-4" />}
                      color="purple"
                    />
                    <StatBox
                      label="Characters"
                      value={ocrResult.fullText.length.toLocaleString()}
                      icon={<FileText className="h-4 w-4" />}
                      color="gray"
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Preview of extracted text
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 max-h-56 overflow-y-auto border border-gray-200">
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
                        {ocrResult.fullText.substring(0, 500)}
                        {ocrResult.fullText.length > 500 && (
                          <span className="text-gray-400 italic">... and more</span>
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGoToEditor}
                className="flex-1 btn btn-primary py-4 text-base shadow-lg shadow-blue-600/25"
              >
                Continue to Editor
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
              <button
                onClick={handleRemoveImage}
                className="btn btn-outline py-4 text-base"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Upload Another
              </button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="animate-fade-in-up space-y-6">
            <UploadProgress
              progress={0}
              status="Processing Failed"
              state="error"
              errorMessage={errorMessage}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleExtractText}
                className="flex-1 btn btn-primary py-4 text-base"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Try Again
              </button>
              <button
                onClick={handleRemoveImage}
                className="btn btn-outline py-4 text-base"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Upload Different Image
              </button>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-yellow-200">
              <h4 className="flex items-center gap-2 font-bold text-yellow-900 mb-3">
                <AlertCircle className="h-5 w-5" />
                Troubleshooting Tips
              </h4>
              <ul className="text-sm text-yellow-800 space-y-2">
                {[
                  "Make sure the image is clear and not blurry",
                  "Ensure text is well-lit and readable",
                  "Try converting the image to PNG format",
                  "Reduce image size if it's very large",
                  "Make sure the image contains actual text",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container py-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              AI-Powered Text Extraction
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Upload Your CV
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Upload any CV file - image, PDF, or Word document - and our AI will extract the text,
              allowing you to edit it like a pro.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10">
            {renderContent()}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Supports Images, PDF & Word Documents
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">100% Free & Private</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "yellow" | "green" | "blue";
}) {
  const colorStyles = {
    yellow: "from-amber-50 to-yellow-50 border-yellow-200 hover:border-yellow-300",
    green: "from-green-50 to-emerald-50 border-green-200 hover:border-green-300",
    blue: "from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300",
  };

  const iconStyles = {
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className={`p-5 rounded-xl bg-gradient-to-br ${colorStyles[color]} border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group cursor-default`}>
      <div className={`w-10 h-10 rounded-lg ${iconStyles[color]} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "green" | "yellow" | "blue" | "purple" | "gray";
}) {
  const colorStyles = {
    green: "bg-gradient-to-br from-green-50 to-emerald-50 text-green-800 border-green-200",
    yellow: "bg-gradient-to-br from-yellow-50 to-amber-50 text-yellow-800 border-yellow-200",
    blue: "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-800 border-blue-200",
    purple: "bg-gradient-to-br from-purple-50 to-violet-50 text-purple-800 border-purple-200",
    gray: "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div className={`p-4 rounded-xl border ${colorStyles[color]} transition-all duration-300 hover:scale-105 hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-1 opacity-70">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
