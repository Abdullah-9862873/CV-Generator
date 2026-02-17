"use client";

import { useState, useCallback, useEffect } from "react";
import CodePanel from "./CodePanel";
import PreviewPanel from "./PreviewPanel";
import { Download, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface SplitEditorProps {
  initialHtml?: string;
  initialCss?: string;
  onRegenerate?: () => void;
  isGenerating?: boolean;
}

type ExportFormat = "html-css" | "pdf" | "docx";

export default function SplitEditor({
  initialHtml = "",
  initialCss = "",
  onRegenerate,
  isGenerating = false,
}: SplitEditorProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    setHtml(initialHtml);
    setCss(initialCss);
  }, [initialHtml, initialCss]);

  const handleCodeChange = useCallback((newHtml: string, newCss: string) => {
    setHtml(newHtml);
    setCss(newCss);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      switch (format) {
        case "html-css": {
          const zip = new JSZip();
          
          let fullHTML = html;
          if (css) {
            fullHTML = html.replace(
              /<\/head>/i,
              `<style>\n${css}\n</style>\n</head>`
            );
          }
          
          zip.file("cv.html", fullHTML);
          zip.file("styles.css", css);
          
          const content = await zip.generateAsync({ type: "blob" });
          saveAs(content, "cv-source-files.zip");
          break;
        }
        
        case "pdf": {
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            const fullHTML = css
              ? html.replace(/<\/head>/i, `<style>${css}</style>\n</head>`)
              : html;
            printWindow.document.write(fullHTML);
            printWindow.document.close();
            printWindow.onload = () => {
              printWindow.print();
            };
          }
          break;
        }
        
        case "docx": {
          const docxContent = generateDocxContent(html);
          const blob = new Blob([docxContent], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          saveAs(blob, "cv.docx");
          break;
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const generateDocxContent = (htmlContent: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    
    const extractText = (element: Element): string => {
      if (element.tagName === "STYLE") return "";
      let text = "";
      for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          text += extractText(child as Element) + "\n";
        }
      }
      return text;
    };
    
    const plainText = extractText(tempDiv);
    
    const headerMatch = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const name = headerMatch ? headerMatch[1].trim() : "CV";
    
    const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="44"/>
        </w:rPr>
        <w:t>${escapeXml(name)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>CV - Generated from ${new Date().toLocaleDateString()}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>${escapeXml(plainText.substring(0, 3000))}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
    
    return header;
  };

  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800">CV Editor</h2>
          <span className="text-xs text-gray-500">
            ({html.length} chars)
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting || !html}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export CV
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => handleExport("html-css")}
                disabled={!html}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                HTML + CSS (Zip)
              </button>
              <button
                onClick={() => handleExport("pdf")}
                disabled={!html}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                PDF (Print)
              </button>
              <button
                onClick={() => handleExport("docx")}
                disabled={!html}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Word Document
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-1/2 p-2">
          <CodePanel
            html={html}
            css={css}
            onCodeChange={handleCodeChange}
            onRegenerate={onRegenerate || (() => {})}
            isGenerating={isGenerating}
          />
        </div>
        
        <div className="w-1/2 p-2">
          <PreviewPanel html={html} css={css} />
        </div>
      </div>
    </div>
  );
}
