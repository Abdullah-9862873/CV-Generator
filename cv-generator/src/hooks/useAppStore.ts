import { create } from "zustand";
import { AppState, CVData, UploadState } from "@/types";
import { LayoutAnalysis, LayoutBlock } from "@/lib/services/layoutAnalyzer";

export interface GeneratedCV {
  html: string;
  css: string;
  text: string;
  colorPalette: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  layout: LayoutAnalysis;
  blocks: LayoutBlock[];
}

export interface AppStateWithGenerated extends AppState {
  generatedCV: GeneratedCV | null;
  isGenerating: boolean;
  generationError: string | null;
  setGeneratedCV: (cv: GeneratedCV | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationError: (error: string | null) => void;
}

const initialCVData: CVData = {
  header: {
    name: "",
    title: "",
    contact: {},
    summary: "",
  },
  sections: [],
  styling: {
    fontFamily: "Inter",
    primaryColor: "#2563eb",
    secondaryColor: "#64748b",
    fontSize: "normal",
    spacing: "normal",
    layout: "single",
  },
};

const initialUploadState: UploadState = {
  file: null,
  preview: null,
  isUploading: false,
  progress: 0,
  error: null,
};

export const useAppStore = create<AppStateWithGenerated>((set) => ({
  currentCV: null,
  uploadState: initialUploadState,
  isEditing: false,
  activeSection: null,
  generatedCV: null,
  isGenerating: false,
  generationError: null,

  setCurrentCV: (cv) => set({ currentCV: cv }),

  setGeneratedCV: (cv) => set({ generatedCV: cv }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  setGenerationError: (error) => set({ generationError: error }),

  updateHeader: (headerUpdates) =>
    set((state) => ({
      currentCV: state.currentCV
        ? {
          ...state.currentCV,
          header: { ...state.currentCV.header, ...headerUpdates },
        }
        : null,
    })),

  updateSection: (sectionId, updates) =>
    set((state) => ({
      currentCV: state.currentCV
        ? {
          ...state.currentCV,
          sections: state.currentCV.sections.map((section) =>
            section.id === sectionId ? { ...section, ...updates } : section
          ),
        }
        : null,
    })),

  addSection: (section) =>
    set((state) => ({
      currentCV: state.currentCV
        ? {
          ...state.currentCV,
          sections: [
            ...state.currentCV.sections,
            {
              ...section,
              id: crypto.randomUUID(),
              order: state.currentCV.sections.length,
            },
          ],
        }
        : null,
    })),

  removeSection: (sectionId) =>
    set((state) => ({
      currentCV: state.currentCV
        ? {
          ...state.currentCV,
          sections: state.currentCV.sections
            .filter((s) => s.id !== sectionId)
            .map((s, index) => ({ ...s, order: index })),
        }
        : null,
    })),

  reorderSections: (newOrder) =>
    set((state) => ({
      currentCV: state.currentCV
        ? {
          ...state.currentCV,
          sections: state.currentCV.sections
            .sort(
              (a, b) =>
                newOrder.indexOf(a.id) - newOrder.indexOf(b.id)
            )
            .map((s, index) => ({ ...s, order: index })),
        }
        : null,
    })),

  setUploadState: (updates) =>
    set((state) => ({
      uploadState: { ...state.uploadState, ...updates },
    })),

  resetUpload: () => set({ uploadState: initialUploadState }),
}));

export const createEmptyCV = (): CVData => ({
  ...initialCVData,
  id: crypto.randomUUID(),
});

export const useCurrentCV = () => useAppStore((state) => state.currentCV);

export const useUploadState = () => useAppStore((state) => state.uploadState);

export const useGeneratedCV = () => useAppStore((state) => state.generatedCV);

export const useIsGenerating = () => useAppStore((state) => state.isGenerating);
