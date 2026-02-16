"use client";

import React, { useState, useCallback, useMemo } from "react";
import { X, Image, AlertTriangle, ZoomIn, ZoomOut, RotateCcw, CheckCircle2, FileText } from "lucide-react";
import { getFileType, getFileTypeDescription } from "@/lib/services/documentService";

interface ImagePreviewProps {
  file: File;
  preview: string;
  onRemove: () => void;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileTypeName = (file: File): string => {
  return getFileTypeDescription(file);
};

const truncateFilename = (name: string, maxLength: number = 30): string => {
  if (name.length <= maxLength) return name;

  const extension = name.split(".").pop() || "";
  const nameWithoutExt = name.substring(0, name.lastIndexOf("."));
  const truncated = nameWithoutExt.substring(0, maxLength - extension.length - 4);

  return `${truncated}... .${extension}`;
};

export function ImagePreview({
  file,
  preview,
  onRemove,
  className = "",
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fileType = useMemo(() => getFileType(file), [file]);
  const isImage = fileType === "image";

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setTimeout(() => setImageLoaded(true), 100);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const toggleZoom = useCallback(() => {
    if (isImage) {
      setIsZoomed((prev) => !prev);
    }
  }, [isImage]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove();
    },
    [onRemove]
  );

  const getFileIcon = () => {
    if (!isImage) {
      if (fileType === "pdf") {
        return (
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
            <FileText className="h-12 w-12 text-red-600" />
          </div>
        );
      }
      if (fileType === "docx") {
        return (
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
        );
      }
    }

    return (
      <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
        <Image className="h-10 w-10 text-blue-600" aria-hidden="true" />
      </div>
    );
  };

  return (
    <div className={`w-full animate-fade-in-up ${className}`}>
      <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg shadow-gray-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50">
        <div
          className={`
            relative bg-gradient-to-br from-gray-50 to-gray-100 
            min-h-[350px] flex items-center justify-center
            ${isImage ? "cursor-zoom-in group" : "cursor-default"}
          `}
          onClick={toggleZoom}
        >
          {isImage && isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 skeleton" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <div className="h-3 w-24 bg-gray-200 rounded-full skeleton" />
                  <div className="h-2 w-16 bg-gray-200 rounded-full skeleton" />
                </div>
              </div>
            </div>
          )}

          {isImage && hasError && (
            <div className="text-center p-8 animate-fade-in">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-50 mb-4 shadow-lg shadow-red-100">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <p className="text-red-800 font-semibold text-lg">Failed to load image</p>
              <p className="text-red-600 text-sm mt-1">
                Please try uploading again
              </p>
              <button
                onClick={handleRemove}
                className="mt-4 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
              >
                <RotateCcw className="h-4 w-4 inline mr-2" />
                Try Again
              </button>
            </div>
          )}

          {!isImage && (
            <div className="text-center p-8 animate-fade-in">
              {getFileIcon()}
              <p className="mt-4 text-gray-700 font-medium text-lg">
                {fileType === "pdf" ? "PDF Document" : "Word Document"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Click &quot;Extract Text&quot; to process this document
              </p>
            </div>
          )}

          {isImage && !hasError && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`Preview of ${file.name}`}
                className={`
                  max-h-[400px] w-auto object-contain rounded-lg
                  transition-all duration-700 ease-out
                  ${isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"}
                  ${imageLoaded ? "shadow-xl" : ""}
                `}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />

              <div
                className={`
                  absolute inset-0 bg-black/0 group-hover:bg-black/10 
                  transition-all duration-300 flex items-center justify-center
                  ${isLoading ? "opacity-0" : "opacity-0 group-hover:opacity-100"}
                `}
              >
                <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300 flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  <span className="text-sm font-medium">Click to zoom</span>
                </div>
              </div>
            </>
          )}

          {isImage && !isLoading && !hasError && (
            <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg shadow-green-500/30 animate-scale-in">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 shadow-sm">
                {!isImage ? (
                  fileType === "pdf" ? (
                    <FileText className="h-6 w-6 text-red-600" />
                  ) : (
                    <FileText className="h-6 w-6 text-blue-600" />
                  )
                ) : (
                  <Image className="h-6 w-6 text-blue-600" aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold text-gray-900 truncate"
                  title={file.name}
                >
                  {truncateFilename(file.name)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getFileTypeName(file)} • {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            <button
              onClick={handleRemove}
              className="
                flex-shrink-0 p-2.5 text-gray-400 
                hover:text-red-500 hover:bg-red-50 
                rounded-xl transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                hover:scale-110 active:scale-95
              "
              aria-label="Remove image"
              title="Remove image"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={toggleZoom}
        >
          <div
            className="relative max-w-6xl max-h-[90vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`Full preview of ${file.name}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />

            <button
              onClick={toggleZoom}
              className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-200 hover:scale-110"
            >
              <X className="h-8 w-8" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
              <ZoomOut className="h-4 w-4 inline mr-2" />
              Click anywhere to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImagePreview;
