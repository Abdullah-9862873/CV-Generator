"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  ChevronDown,
  ChevronUp,
  Maximize2,
  GitCompare
} from "lucide-react";
import { 
  compareImages, 
  generateDiffImage, 
  generateSideBySideComparison,
  ComparisonResult 
} from "@/lib/services/visualComparison";

interface VisualComparisonProps {
  originalImage: string;
  generatedHtml: string;
  isOpen: boolean;
  onClose: () => void;
  onImprove?: () => void;
}

type ViewMode = 'side-by-side' | 'overlay' | 'diff' | 'split';

export default function VisualComparison({
  originalImage,
  generatedHtml,
  isOpen,
  onClose,
  onImprove,
}: VisualComparisonProps) {
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [diffImage, setDiffImage] = useState<string | null>(null);
  const [sideBySideImage, setSideBySideImage] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Convert HTML to image
  const convertHtmlToImage = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const iframe = iframeRef.current;
      if (!iframe) {
        reject(new Error('Iframe not found'));
        return;
      }

      // Wait for iframe to load
      setTimeout(() => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Set canvas size to match typical CV dimensions
          canvas.width = 794; // A4 width at 96 DPI
          canvas.height = 1123; // A4 height at 96 DPI

          // Fill white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Get the iframe content as data URL
          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
              <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  ${generatedHtml}
                </div>
              </foreignObject>
            </svg>
          `;
          
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => reject(new Error('Failed to render HTML to image'));
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
        } catch (error) {
          reject(error);
        }
      }, 1000); // Wait for styles to apply
    });
  }, [generatedHtml]);

  // Perform comparison
  const performComparison = useCallback(async () => {
    if (!originalImage || !generatedHtml) return;
    
    setIsComparing(true);
    try {
      // Convert HTML to image
      const genImg = await convertHtmlToImage();
      setGeneratedImage(genImg);

      // Compare images
      const result = await compareImages(originalImage, genImg, {
        tolerance: 20,
        highlightDifferences: true,
      });
      setComparisonResult(result);

      // Generate diff image
      const diff = await generateDiffImage(originalImage, genImg);
      setDiffImage(diff);

      // Generate side-by-side
      const sideBySide = await generateSideBySideComparison(originalImage, genImg, {
        original: 'Original CV',
        generated: 'Generated Replica',
      });
      setSideBySideImage(sideBySide);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setIsComparing(false);
    }
  }, [originalImage, generatedHtml, convertHtmlToImage]);

  // Run comparison when opened
  useEffect(() => {
    if (isOpen && !comparisonResult && !isComparing) {
      performComparison();
    }
  }, [isOpen, performComparison, comparisonResult, isComparing]);

  // Get quality color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GitCompare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Visual Comparison</h2>
              <p className="text-sm text-gray-500">Compare original CV with generated replica</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {comparisonResult && (
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getQualityColor(comparisonResult.analysis.overallQuality)}`}>
                {comparisonResult.analysis.overallQuality.charAt(0).toUpperCase() + comparisonResult.analysis.overallQuality.slice(1)} Match
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Metrics */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            {isComparing ? (
              <div className="flex flex-col items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-sm text-gray-600">Analyzing images...</p>
              </div>
            ) : comparisonResult ? (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(comparisonResult.similarityScore)}`}>
                      {comparisonResult.similarityScore.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Similarity Score</p>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Detailed Metrics</h3>
                  
                  <div className="space-y-3">
                    <MetricBar
                      label="Color Accuracy"
                      value={comparisonResult.analysis.colorAccuracy}
                      icon={<div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 via-green-400 to-blue-400" />}
                    />
                    <MetricBar
                      label="Layout Accuracy"
                      value={comparisonResult.analysis.layoutAccuracy}
                      icon={<Maximize2 className="w-4 h-4" />}
                    />
                    <MetricBar
                      label="Pixel Match"
                      value={comparisonResult.matchPercentage}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    />
                  </div>
                </div>

                {/* Issues Found */}
                {comparisonResult.differences.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Differences Found</h3>
                      <span className="text-sm text-gray-500">{comparisonResult.differences.length}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {comparisonResult.differences.slice(0, 5).map((diff, idx) => (
                        <div
                          key={idx}
                          className={`text-sm p-2 rounded-lg ${
                            diff.severity === 'high' ? 'bg-red-50 text-red-700' :
                            diff.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-blue-50 text-blue-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="capitalize">{diff.type} difference</span>
                          </div>
                          <p className="text-xs mt-1 opacity-80">
                            Region: {diff.width}×{diff.height}px at ({diff.x}, {diff.y})
                          </p>
                        </div>
                      ))}
                      {comparisonResult.differences.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{comparisonResult.differences.length - 5} more differences
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {comparisonResult.similarityScore < 85 && onImprove && (
                  <button
                    onClick={onImprove}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Improve Replica
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Click compare to analyze</p>
              </div>
            )}
          </div>

          {/* Main View Area */}
          <div className="flex-1 flex flex-col bg-gray-100">
            {/* View Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
              <div className="flex items-center gap-2">
                {(['side-by-side', 'overlay', 'diff', 'split'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                {sideBySideImage && (
                  <a
                    href={sideBySideImage}
                    download="cv-comparison.png"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Download comparison"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                  </a>
                )}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Details
                </button>
              </div>
            </div>

            {/* Image Display */}
            <div className="flex-1 overflow-auto p-6">
              {viewMode === 'side-by-side' && sideBySideImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sideBySideImage}
                  alt="Side by side comparison"
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                />
              )}
              
              {viewMode === 'diff' && diffImage && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">Red areas show differences between original and replica</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={diffImage}
                    alt="Difference visualization"
                    className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                  />
                </div>
              )}
              
              {viewMode === 'overlay' && (
                <OverlayComparison 
                  originalImage={originalImage}
                  generatedImage={generatedImage}
                />
              )}
              
              {viewMode === 'split' && (
                <SplitComparison
                  originalImage={originalImage}
                  generatedImage={generatedImage}
                />
              )}
            </div>
          </div>
        </div>

        {/* Hidden iframe for HTML rendering */}
        <iframe
          ref={iframeRef}
          srcDoc={generatedHtml}
          className="hidden"
          title="Generated CV"
        />
      </div>
    </div>
  );
}

// Metric Bar Component
function MetricBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const getColor = (v: number) => {
    if (v >= 90) return 'bg-green-500';
    if (v >= 75) return 'bg-blue-500';
    if (v >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-medium text-gray-900">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Overlay Comparison Component
function OverlayComparison({ originalImage, generatedImage }: { originalImage: string; generatedImage: string | null }) {
  const [opacity, setOpacity] = useState(50);
  const [showOriginal, setShowOriginal] = useState(true);

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            {showOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showOriginal ? 'Original' : 'Generated'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Opacity</span>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-xs text-gray-500">{opacity}%</span>
          </div>
        </div>
      </div>
      
      <div className="relative rounded-lg shadow-lg overflow-hidden bg-white">
        {showOriginal && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={originalImage}
            alt="Original"
            className="w-full h-auto"
          />
        )}
        {generatedImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={generatedImage}
            alt="Generated"
            className="absolute top-0 left-0 w-full h-auto transition-opacity"
            style={{ opacity: opacity / 100 }}
          />
        )}
      </div>
    </div>
  );
}

// Split Comparison Component
function SplitComparison({ originalImage, generatedImage }: { originalImage: string; generatedImage: string | null }) {
  const [splitPosition, setSplitPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSplitPosition(Math.max(0, Math.min(100, percentage)));
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="relative max-w-4xl mx-auto cursor-ew-resize select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 shadow-lg">
        <span className="text-sm font-medium text-gray-700">Original</span>
      </div>
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 shadow-lg">
        <span className="text-sm font-medium text-gray-700">Generated</span>
      </div>
      
      <div className="relative rounded-lg shadow-lg overflow-hidden bg-white">
        {/* Original Image (Left) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalImage}
          alt="Original"
          className="w-full h-auto"
        />
        
        {/* Generated Image (Right) - Clipped */}
        {generatedImage && (
          <div
            className="absolute top-0 right-0 h-full overflow-hidden"
            style={{ width: `${100 - splitPosition}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generatedImage}
              alt="Generated"
              className="absolute top-0 right-0 h-full w-auto max-w-none"
              style={{ 
                width: `${100 / ((100 - splitPosition) / 100)}%`,
                objectFit: 'cover'
              }}
            />
          </div>
        )}
        
        {/* Split Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize z-20"
          style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-white" />
              <div className="w-0.5 h-3 bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
