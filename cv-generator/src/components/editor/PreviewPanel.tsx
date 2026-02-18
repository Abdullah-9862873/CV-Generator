"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Printer } from "lucide-react";

interface PreviewPanelProps {
  html: string;
  css: string;
}

export default function PreviewPanel({ html, css }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [zoom, setZoom] = useState(60);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Merge external CSS into the HTML document if the AI returned them separately.
   * If the HTML already contains a <style> block, we inject the extra CSS alongside it.
   * The result is always a single, self-contained HTML document.
   */
  const buildDocument = (htmlContent: string, cssContent: string): string => {
    if (!htmlContent) return "";

    // If there is extra CSS and the HTML doesn't already embed it, inject it.
    if (cssContent && cssContent.trim()) {
      const hasStyle = /<style[\s\S]*<\/style>/i.test(htmlContent);
      if (!hasStyle) {
        // Inject before </head>
        if (/<\/head>/i.test(htmlContent)) {
          return htmlContent.replace(
            /<\/head>/i,
            `<style>\n${cssContent}\n</style>\n</head>`
          );
        }
        // No <head> tag – prepend a style block
        return `<style>\n${cssContent}\n</style>\n${htmlContent}`;
      }
      // HTML already has <style>; append extra CSS inside the existing block
      return htmlContent.replace(
        /(<style[^>]*>)([\s\S]*?)(<\/style>)/i,
        `$1$2\n/* extra */\n${cssContent}\n$3`
      );
    }

    return htmlContent;
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsLoading(true);
    setError(null);

    if (!html || !html.trim()) {
      setIsLoading(false);
      return;
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      setError("Preview unavailable");
      setIsLoading(false);
      return;
    }

    try {
      const fullDocument = buildDocument(html, css);

      doc.open();
      doc.write(fullDocument);
      doc.close();

      // Wait for the document to paint before marking as loaded
      const onLoad = () => setIsLoading(false);
      if (iframe.contentWindow) {
        iframe.contentWindow.addEventListener("load", onLoad, { once: true });
      }
      // Fallback timeout in case the load event already fired
      setTimeout(() => setIsLoading(false), 800);
    } catch (err) {
      console.error("Preview render error", err);
      setError("Failed to render preview");
      setIsLoading(false);
    }
  }, [html, css]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 20));
  const handleResetZoom = () => setZoom(60);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-2 text-sm font-medium text-gray-600">Preview</span>
          {isLoading && (
            <span className="text-xs text-blue-500 animate-pulse ml-1">Rendering…</span>
          )}
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
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors min-w-[3rem] text-center"
            title="Reset zoom"
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
            onClick={handleResetZoom}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Reset zoom to fit"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Print CV"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview area – scrollable so the full CV is always reachable */}
      <div className="flex-1 overflow-auto p-4 bg-gray-200">
        <div className="flex justify-center">
          {error ? (
            <div className="flex items-center justify-center text-red-500 bg-white rounded-lg p-8 shadow">
              {error}
            </div>
          ) : !html ? (
            <div className="flex items-center justify-center text-gray-400 bg-white rounded-lg p-8 shadow">
              No CV to preview yet.
            </div>
          ) : (
            <div
              className="relative bg-white shadow-xl rounded-sm overflow-hidden"
              style={{
                /* The iframe renders at 100% natural size; we scale the wrapper */
                width: `${794 * (zoom / 100)}px`,   /* A4 width ≈ 794px at 96dpi */
                minHeight: `${1123 * (zoom / 100)}px`, /* A4 height ≈ 1123px */
                transformOrigin: "top center",
              }}
            >
              <iframe
                ref={iframeRef}
                className="border-0 block"
                title="CV Preview"
                sandbox="allow-same-origin allow-scripts"
                style={{
                  width: "794px",           /* natural A4 width */
                  height: "1123px",         /* natural A4 height – will grow if content is taller */
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top left",
                  opacity: isLoading ? 0 : 1,
                  transition: "opacity 0.3s ease",
                  minHeight: "1123px",
                }}
                scrolling="no"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
