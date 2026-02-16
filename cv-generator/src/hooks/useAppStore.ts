import { create } from "zustand";
import { AppState, CVData, UploadState } from "@/types";

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

export const useAppStore = create<AppState>((set) => ({
  currentCV: null,
  uploadState: initialUploadState,
  isEditing: false,
  activeSection: null,

  setCurrentCV: (cv) => set({ currentCV: cv }),

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
