"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Download } from "lucide-react";

interface PreviewPanelProps {
  html: string;
  css: string;
}

export default function PreviewPanel({ html, css }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 900, height: 1200 });
  const scaledWidth = pageSize.width * (zoom / 100);
  const scaledHeight = pageSize.height * (zoom / 100);

  useEffect(() => {
    if (!iframeRef.current) return;

    setIsLoading(true);
    setError(null);

    const combinedHTML = css
      ? html.replace(/<\/head>/i, `<style>${css}</style>\n</head>`)
      : html;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) {
      setError("Preview unavailable");
      setIsLoading(false);
      return;
    }

    try {
      doc.open();
      doc.write(combinedHTML);
      doc.close();
      // measure dimensions after paint
      requestAnimationFrame(() => {
        const { body, documentElement } = doc;
        const measuredWidth = Math.max(
          body?.scrollWidth || 0,
          body?.offsetWidth || 0,
          documentElement?.scrollWidth || 0,
          documentElement?.offsetWidth || 0,
          1
        );
        const measuredHeight = Math.max(
          body?.scrollHeight || 0,
          body?.offsetHeight || 0,
          documentElement?.scrollHeight || 0,
          documentElement?.offsetHeight || 0,
          1
        );
        setPageSize({
          width: measuredWidth,
          height: measuredHeight,
        });
        setIsLoading(false);
      });
    } catch (err) {
      console.error("Preview render error", err);
      setError("Failed to render preview");
      setIsLoading(false);
    }
  }, [html, css]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-2 text-sm font-medium text-gray-600">Preview</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors min-w-[3rem]"
          >
            {zoom}%
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <button
            onClick={handlePrint}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Print CV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-200">
        <div className="flex justify-center">
          <div
            className="relative bg-white shadow-lg"
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
            }}
          >
            <iframe
              ref={iframeRef}
              className="border-0"
              title="CV Preview"
              sandbox="allow-same-origin"
              style={{
                opacity: isLoading || error ? 0 : 1,
                width: `${pageSize.width}px`,
                height: `${pageSize.height}px`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
              }}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-white">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
