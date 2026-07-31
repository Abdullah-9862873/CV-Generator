export interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
}

export interface CVHeader {
  name: string;
  title?: string;
  contact: ContactInfo;
  summary?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  items: string[];
}

export type SectionType =
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "custom";

export interface CVSection {
  id: string;
  type: SectionType;
  title: string;
  order: number;
  content: ExperienceItem[] | EducationItem[] | SkillCategory[] | string[];
}

export interface CVData {
  id?: string;
  header: CVHeader;
  sections: CVSection[];
  styling: CVStyling;
}

export interface CVStyling {
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  fontSize: "small" | "normal" | "large";
  spacing: "compact" | "normal" | "spacious";
  layout: "single" | "double";
}

export interface OCRResult {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface UploadState {
  file: File | null;
  preview: string | null;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export interface AppState {
  currentCV: CVData | null;
  uploadState: UploadState;
  isEditing: boolean;
  activeSection: string | null;
  setCurrentCV: (cv: CVData | null) => void;
  updateHeader: (header: Partial<CVHeader>) => void;
  updateSection: (sectionId: string, updates: Partial<CVSection>) => void;
  addSection: (section: Omit<CVSection, "id">) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (newOrder: string[]) => void;
  setUploadState: (state: Partial<UploadState>) => void;
  resetUpload: () => void;
}
