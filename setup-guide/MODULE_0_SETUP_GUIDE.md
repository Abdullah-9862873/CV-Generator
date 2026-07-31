# Module 0: Project Foundation - Complete Setup Guide

This document contains all commands and steps used to set up the CV Generator project.
Keep this file as a reference - we will remove detailed comments from the code when moving to Module 1.

---

## 📋 Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed (`node --version`)
- npm installed (`npm --version`)
- A code editor (VS Code recommended)

---

## 🚀 Step 1: Initialize Next.js Project

### Command Used:
```bash
npx create-next-app@14 cv-generator --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

### Explanation of Each Flag:

| Flag | Purpose |
|------|---------|
| `npx` | Executes npm packages without installing them globally |
| `create-next-app@14` | Creates a Next.js project using version 14 (stable) |
| `cv-generator` | Project name (becomes folder name) |
| `--typescript` | Adds TypeScript support for type safety |
| `--tailwind` | Includes Tailwind CSS for styling |
| `--eslint` | Adds ESLint for code quality/linting |
| `--app` | Uses the new App Router (recommended over Pages Router) |
| `--src-dir` | Places source code in `src/` folder (cleaner structure) |
| `--import-alias "@/*"` | Sets up path alias so `@/components` works |
| `--use-npm` | Uses npm instead of yarn/pnpm |

### What This Command Does:
1. Creates a new folder called `cv-generator/`
2. Installs Next.js 14 + React + TypeScript
3. Configures Tailwind CSS with PostCSS
4. Sets up ESLint configuration
5. Creates folder structure with `src/app/`
6. Initializes a git repository
7. Installs all dependencies

### Expected Output:
- Success message after ~2-3 minutes
- Project folder created at `./cv-generator/`
- All dependencies installed in `node_modules/`

---

## 📁 Step 2: Create Project Folder Structure

### Command Used:
```bash
cd cv-generator && mkdir -p src/components/ui src/components/cv src/hooks src/lib src/types src/app/api src/app/upload src/app/editor src/app/preview src/app/dashboard
```

### Explanation:

```bash
cd cv-generator           # Navigate into project folder
mkdir -p                  # Create parent directories if they don't exist

# Folder purposes:
src/components/ui        # Reusable UI components (buttons, inputs)
src/components/cv        # CV-specific components (renderers, editors)
src/hooks                # Custom React hooks (state management)
src/lib                  # Utility functions (helpers)
src/types                # TypeScript type definitions
src/app/api              # API routes (backend endpoints)
src/app/upload           # Upload page route
src/app/editor           # Editor page route
src/app/preview          # Preview page route
src/app/dashboard        # Dashboard page route
```

### Why This Structure?
- **Separation of concerns**: UI vs business logic vs types
- **Scalable**: Easy to add new features
- **Maintainable**: Clear organization
- **Next.js convention**: `app/` folder creates routes automatically

---

## 📦 Step 3: Install Core Dependencies

### Command Used:
```bash
npm install zustand lucide-react clsx tailwind-merge @types/node
```

### Explanation of Each Package:

#### 1. **zustand** (State Management)
```
purpose: Lightweight global state management
why: Simpler than Redux, no context providers needed
usage: Store CV data, upload state, UI state
```

#### 2. **lucide-react** (Icons)
```
purpose: Beautiful, consistent icon library
why: SVG-based, customizable, tree-shakeable
usage: Navigation icons, UI elements
```

#### 3. **clsx** (Class Name Utilities)
```
purpose: Conditional class name joining
why: Cleaner than template strings for conditional classes
usage: cn() utility function
```

#### 4. **tailwind-merge** (Tailwind Utilities)
```
purpose: Merge Tailwind classes without conflicts
why: Resolves conflicting classes (e.g., px-4 vs px-6)
usage: Combined with clsx in cn() function
```

#### 5. **@types/node** (TypeScript Types)
```
purpose: TypeScript definitions for Node.js
why: Required for TypeScript to understand Node APIs
usage: Process, Buffer, etc.
```

### What Happens During Installation:
1. npm downloads packages from registry
2. Packages are extracted to `node_modules/`
3. Dependencies are added to `package.json`
4. `package-lock.json` is updated with exact versions

---

## 🎨 Step 4: Configure Tailwind CSS

### File: `tailwind.config.ts`

**Purpose**: Configure Tailwind with custom theme settings

**Key Additions**:
```typescript
fontFamily: {
  sans: ["var(--font-inter)", "system-ui", "sans-serif"],
}
```
- Uses Inter font loaded by Next.js
- Fallback to system fonts

```typescript
animation: {
  "fade-in": "fadeIn 0.2s ease-in-out",
  "slide-up": "slideUp 0.3s ease-out",
}
```
- Custom animations for smooth UI transitions

---

## 📝 Step 5: Create Utility Functions

### File: `src/lib/utils.ts`

**Purpose**: Central location for helper functions

**The `cn()` Function**:
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Why This Matters**:
- **clsx**: Conditionally joins classes
  ```tsx
  cn("px-4", isActive && "bg-blue-500", "py-2")
  // Result when active: "px-4 bg-blue-500 py-2"
  // Result when inactive: "px-4 py-2"
  ```

- **tailwind-merge**: Resolves conflicts
  ```tsx
  cn("px-4", "px-6") // Result: "px-6" (not "px-4 px-6")
  ```

**Usage Throughout App**:
```tsx
<div className={cn("base-styles", isActive && "active-styles")}>
```

---

## 🏗️ Step 6: Define TypeScript Types

### File: `src/types/index.ts`

**Purpose**: Single source of truth for all data structures

**Key Interfaces**:

1. **CVHeader**: Personal information
   - name, title, contact info, summary

2. **ExperienceItem**: Work history entries
   - company, position, dates, description bullets

3. **EducationItem**: Education entries
   - institution, degree, dates, GPA

4. **CVSection**: Generic section container
   - Can hold different types (experience, education, skills)
   - Has order property for reordering

5. **CVData**: Complete CV structure
   - Header + sections + styling preferences

6. **AppState**: Zustand store structure
   - currentCV: the CV being edited
   - uploadState: file upload progress
   - Actions: functions to modify state

**Why Types Matter**:
- Catch errors at compile time (not runtime)
- IDE autocomplete and suggestions
- Self-documenting code
- Refactoring safety

---

## 🔄 Step 7: Set Up Global State (Zustand)

### File: `src/hooks/useAppStore.ts`

**Purpose**: Manage application state globally

**What is Zustand?**
- Lightweight state management library
- No context providers needed (unlike Redux)
- Simple API: create() → useStore()
- Excellent TypeScript support

**Store Structure**:
```typescript
{
  // State
  currentCV: CVData | null,      // The CV being edited
  uploadState: UploadState,      // File upload progress
  isEditing: boolean,            // Editor mode flag
  activeSection: string | null,  // Currently selected section

  // Actions
  setCurrentCV: (cv) => void,           // Load a CV
  updateHeader: (updates) => void,      // Modify header
  updateSection: (id, updates) => void, // Modify section
  addSection: (section) => void,        // Add new section
  removeSection: (id) => void,          // Delete section
  reorderSections: (order) => void,     // Change order
  setUploadState: (updates) => void,    // Update upload
  resetUpload: () => void,              // Clear upload
}
```

**How State Updates Work**:
```typescript
// Instead of setState in components:
const updateName = () => {
  setCurrentCV({ ...currentCV, header: { ...header, name: "New" }});
};

// We use actions from the store:
updateHeader({ name: "New" }); // Clean and simple!
```

**Usage in Components**:
```typescript
// Get entire store
const store = useAppStore();

// Or subscribe to specific parts (performance optimization)
const currentCV = useAppStore((state) => state.currentCV);
const updateHeader = useAppStore((state) => state.updateHeader);
```

---

## 🧭 Step 8: Create Navigation Component

### File: `src/components/Navigation.tsx`

**Purpose**: Top navigation bar visible on all pages

**Key Features**:

1. **Next.js Link Component**:
   ```tsx
   <Link href="/upload">Upload</Link>
   ```
   - Client-side navigation (no page reload)
   - Prefetches pages for instant navigation
   - Maintains scroll position

2. **Active State Detection**:
   ```tsx
   const pathname = usePathname();
   const isActive = pathname === item.href;
   ```
   - Highlights current page
   - Uses Next.js usePathname hook

3. **Responsive Design**:
   - Mobile: Icons only (saves space)
   - Desktop: Icons + text labels
   - Uses Tailwind responsive prefixes (sm:, lg:)

4. **Styling Strategy**:
   ```tsx
   className={cn(
     "base-styles",           // Always applied
     isActive                 // Conditional
       ? "active-styles"      // When active
       : "inactive-styles"    // When not active
   )}
   ```

---

## 🏠 Step 9: Create Root Layout

### File: `src/app/layout.tsx`

**Purpose**: Wraps ALL pages with common elements

**What is a Layout?**
- Persists across navigation (doesn't re-render)
- Contains UI elements present on every page
- Next.js convention: `layout.tsx` in app folder

**Components in Layout**:
1. **HTML Structure**: lang attribute, body tag
2. **Fonts**: Inter font loaded via next/font
3. **Navigation**: Persistent nav bar
4. **Main Content**: {children} - where page content goes
5. **Footer**: Appears on all pages

**Font Loading**:
```typescript
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
```
- Next.js optimizes fonts automatically
- Creates CSS variable for Tailwind
- No external font requests (self-hosted)

**Children Prop**:
```typescript
export default function RootLayout({ children }) {
  return (
    <body>
      <Navigation />
      <main>{children}</main>  {/* Page content here */}
    </body>
  );
}
```

---

## 🎨 Step 10: Global Styles

### File: `src/app/globals.css`

**Purpose**: Global CSS rules and Tailwind directives

**Three Tailwind Layers**:

1. **@tailwind base**: Reset styles + base HTML elements
2. **@tailwind components**: Reusable component classes
3. **@tailwind utilities**: Utility classes (padding, margin, etc.)

**Custom Additions**:

```css
@layer base {
  /* Smooth scrolling for anchor links */
  html { scroll-behavior: smooth; }
  
  /* Accessible focus states */
  :focus-visible {
    @apply outline-none ring-2 ring-blue-600 ring-offset-2;
  }
}
```

```css
@layer components {
  /* Container utility */
  .container {
    @apply mx-auto max-w-7xl px-4 sm:px-6 lg:px-8;
  }
  
  /* Button variants */
  .btn-primary { /* blue button */ }
  .btn-secondary { /* gray button */ }
}
```

```css
@layer utilities {
  /* Custom animations */
  .animate-fade-in { /* fade in animation */ }
}
```

---

## 📄 Step 11: Create Homepage

### File: `src/app/page.tsx`

**Purpose**: Landing page - first impression for users

**Sections Built**:

1. **Hero Section**:
   - Main headline with gradient text
   - Badge showing "100% Free"
   - Call-to-action buttons
   - Decorative background blur

2. **How It Works** (3 steps):
   - Upload Screenshot
   - AI Extraction & Edit
   - Export Any Format
   - Each with icon, number badge, description

3. **Features Grid** (6 features):
   - OCR Text Extraction
   - Layout Detection
   - Full Customization
   - Multiple Formats
   - Privacy First
   - No Watermarks

4. **CTA Section**:
   - Blue background
   - Final call to action
   - Link to upload page

**Design Principles Used**:
- Clear visual hierarchy (headlines → subtext → buttons)
- Whitespace for breathing room
- Consistent spacing (multiples of 4px)
- Blue as primary action color
- Cards for grouping related content

---

## 📄 Step 12: Create Placeholder Pages

### Files Created:
- `src/app/upload/page.tsx`
- `src/app/editor/page.tsx`
- `src/app/dashboard/page.tsx`

**Purpose**: Define routes that will be implemented in future modules

**Why Placeholders?**
1. Test routing works
2. Navigation links have targets
3. Visualize app structure
4. Prepare for upcoming modules

**Each Placeholder Includes**:
- Page heading
- Brief description
- Visual mockup (gray boxes)
- "Coming in Module X" info box

---

## 🧪 Step 13: Build & Test

### Commands Used:

```bash
# Build for production (catches errors)
npm run build

# Start development server
npm run dev
```

**Build Process Explained**:

1. **Compilation**:
   - TypeScript → JavaScript
   - JSX → JavaScript
   - Tailwind → CSS

2. **Optimization**:
   - Code splitting (chunks)
   - Tree shaking (remove unused code)
   - Minification (smaller files)

3. **Static Generation**:
   - Pages without dynamic data → HTML files
   - Faster loading, SEO-friendly
   - Our pages are all static for now

4. **Output**:
   - `.next/` folder with compiled code
   - Route analysis showing page sizes

**Development Server**:
- Hot reloading (instant updates on save)
- Fast Refresh (preserves component state)
- Source maps for debugging
- Runs at http://localhost:3000

---

## 📊 Build Output Explained

```
Route (app)                              Size     First Load JS
┌ ○ /                                    177 B          96.1 kB
├ ○ /_not-found                          873 B          88.1 kB
├ ○ /dashboard                           177 B          96.1 kB
├ ○ /editor                              142 B          87.4 kB
└ ○ /upload                              142 B          87.4 kB
```

**Symbols**:
- `○` = Statically generated (no server needed)
- `λ` = Server-side rendered (requires server)

**Size Metrics**:
- **Size**: JavaScript code for that page only
- **First Load JS**: Total JS needed (shared chunks + page)

---

## 🎯 Module 0 Summary

### What Was Accomplished:
✅ Next.js 14 project initialized with TypeScript
✅ Tailwind CSS configured with custom theme
✅ Project structure organized
✅ Dependencies installed (Zustand, Lucide, etc.)
✅ TypeScript types defined
✅ Global state management setup
✅ Navigation component built
✅ Homepage with hero, features, and CTAs
✅ Placeholder pages for all routes
✅ Global styles and utilities
✅ Production build successful
✅ Development server running

### Files Created: 12
- 4 page files (Home, Upload, Editor, Dashboard)
- 1 layout file
- 1 navigation component
- 1 global styles file
- 1 types file
- 1 store file
- 1 utilities file
- 2 config files (tailwind, next)

### Total Lines of Code: ~800+

### Key Concepts Learned:
1. Next.js App Router and file-based routing
2. TypeScript interfaces and type safety
3. Tailwind CSS utility classes
4. Zustand for global state
5. Component composition
6. Responsive design patterns
7. Build and development workflows

---

## 🚀 Next Steps

**Module 1 Preview**: Image Upload Component
- Drag-and-drop functionality
- File validation
- Image preview
- Progress indicators
- Error handling

Ready to continue? Run `npm run dev` and visit http://localhost:3000!

---

## 💡 Quick Reference Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Install new package
npm install package-name

# Check for outdated packages
npm outdated
```

---

**Document Version**: Module 0 Complete
**Last Updated**: 2024
**Next Module**: Image Upload (Module 1)
