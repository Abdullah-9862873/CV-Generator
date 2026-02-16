"use client";

import React, { useCallback, useState, useRef } from "react";
import { Upload, X, AlertCircle, FileUp, Image } from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: "image" | "pdf" | "docx";
}

const DEFAULT_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx";
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_SIZE_DISPLAY = "10MB";

const validateFile = (file: File, accept: string, maxSize: number): ValidationResult => {
  const fileName = file.name.toLowerCase();

  const isPng = file.type === "image/png" || fileName.endsWith(".png");
  const isJpeg = file.type === "image/jpeg" || file.type === "image/jpg" || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg");
  const isWebp = file.type === "image/webp" || fileName.endsWith(".webp");
  const isImage = isPng || isJpeg || isWebp;

  const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");

  const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.endsWith(".docx");

  let fileType: "image" | "pdf" | "docx" | undefined;
  if (isImage) fileType = "image";
  else if (isPdf) fileType = "pdf";
  else if (isDocx) fileType = "docx";

  if (!isImage && !isPdf && !isDocx) {
    return {
      isValid: false,
      error: `Invalid file type. Please upload an image (PNG, JPG, WEBP), PDF, or Word document (DOCX).`,
      fileType: undefined,
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${MAX_SIZE_DISPLAY}.`,
      fileType,
    };
  }

  return { isValid: true, fileType };
};

export function DropZone({
  onFileSelect,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false,
}: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    if (disabled) return;
    const input = document.getElementById("file-input") as HTMLInputElement;
    if (input) input.click();
  }, [disabled]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setTimeout(() => setIsDragOver(true), 50);
    setError(null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
      setTimeout(() => setIsDragging(false), 100);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;

      if (files.length === 0) {
        setError("No file detected. Please try again.");
        return;
      }

      const file = files[0];
      const validation = validateFile(file, accept, maxSize);

      if (!validation.isValid) {
        setError(validation.error || "Invalid file");
        return;
      }

      setError(null);
      onFileSelect(file);
    },
    [accept, maxSize, disabled, onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (!files || files.length === 0) return;

      const file = files[0];
      const validation = validateFile(file, accept, maxSize);

      if (!validation.isValid) {
        setError(validation.error || "Invalid file");
        return;
      }

      setError(null);
      onFileSelect(file);

      e.target.value = "";
    },
    [accept, maxSize, onFileSelect]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="w-full animate-fade-in-up">
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 animate-scale-in shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600 hover:bg-red-100 p-1 rounded-lg transition-all duration-200"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl border-2 border-dashed p-12 text-center
          transition-all duration-500 ease-out cursor-pointer overflow-hidden
          ${disabled
            ? "bg-gray-50 border-gray-300 cursor-not-allowed opacity-60"
            : isDragOver
              ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500 shadow-xl shadow-blue-500/20 scale-[1.02]"
              : "bg-gradient-to-br from-gray-50 to-white border-gray-300 hover:border-blue-400 hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.01]"
          }
        `}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload CV file - click or drag and drop"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          id="file-input"
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
          aria-hidden="true"
        />

        <div
          className={`
            absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-purple-100/50
            transition-opacity duration-500
            ${isDragOver ? "opacity-100" : "opacity-0"}
          `}
        />

        <div className="relative mb-6">
          <div
            className={`
              mx-auto flex h-24 w-24 items-center justify-center rounded-2xl
              transition-all duration-500 ease-out
              ${isDragOver
                ? "bg-gradient-to-br from-blue-500 to-blue-600 scale-110 shadow-xl shadow-blue-500/30 rotate-3"
                : "bg-gradient-to-br from-blue-100 to-blue-50 group-hover:scale-105"
              }
            `}
          >
            {isDragOver ? (
              <FileUp className="h-12 w-12 text-white animate-bounce-soft" />
            ) : (
              <div className="relative">
                <Image className="h-10 w-10 text-blue-600 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                <Upload
                  className={`
                    absolute -bottom-1 -right-1 h-5 w-5 text-blue-500
                    transition-all duration-300
                    ${isDragging ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}
                  `}
                />
              </div>
            )}
          </div>

          {isDragOver && (
            <>
              <span className="absolute top-0 left-1/4 h-2 w-2 rounded-full bg-blue-400 animate-ping" />
              <span className="absolute top-4 right-1/4 h-1.5 w-1.5 rounded-full bg-blue-300 animate-ping" style={{ animationDelay: "0.2s" }} />
              <span className="absolute bottom-2 left-1/3 h-1 w-1 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: "0.4s" }} />
            </>
          )}
        </div>

        <div className="relative space-y-2">
          <h3
            className={`
              text-xl font-bold transition-all duration-300
              ${isDragOver ? "text-blue-700 scale-105" : "text-gray-900"}
            `}
          >
            {isDragOver ? "Drop your file here" : "Drag & drop your CV"}
          </h3>
          <p className="text-sm text-gray-500">
            or <span className="text-blue-600 font-medium hover:underline cursor-pointer">click to browse</span>
          </p>
          <p className="text-xs text-gray-400 pt-2">
            Supports: Images (PNG, JPG, WEBP), PDF, DOCX (max {MAX_SIZE_DISPLAY})
          </p>
        </div>

        <div
          className={`
            absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500
            transition-all duration-500 ease-out
            ${isDragOver ? "w-full" : "w-0"}
          `}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <FileUp className="h-3.5 w-3.5" />
        <span>Tip: For best results, use a clear, well-lit image or document</span>
      </div>
    </div>
  );
}

export default DropZone;
