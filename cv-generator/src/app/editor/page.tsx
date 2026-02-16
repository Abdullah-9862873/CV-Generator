/**
 * Editor Page (Module 4)
 * 
 * This page will be the main CV editor interface:
 * - Sidebar with sections list
 * - Form fields for editing content
 * - Real-time preview
 * - Styling controls
 * 
 * Currently a placeholder - will implement in Module 4
 */

export default function EditorPage() {
  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900">CV Editor</h1>
        <p className="mt-2 text-gray-600">
          Edit your CV content, styling, and layout
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar placeholder */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Sections</h2>
            <div className="space-y-2">
              {["Header", "Experience", "Education", "Skills"].map((section) => (
                <div
                  key={section}
                  className="rounded-md bg-gray-100 p-3 text-sm text-gray-700"
                >
                  {section}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview placeholder */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white p-8 min-h-[600px]">
            <div className="border-b-2 border-gray-200 pb-4 mb-6">
              <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-100 rounded"></div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
              </div>
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-3">
                  <div className="h-20 bg-gray-50 rounded p-4">
                    <div className="h-4 w-40 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-24 bg-gray-100 rounded mb-2"></div>
                    <div className="h-3 w-full bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Coming in Module 4
        </h4>
        <p className="text-sm text-blue-700">
          The editor will include a sidebar for managing sections, inline editing
          forms, real-time preview, and styling controls. This requires Modules
          1-3 to be completed first.
        </p>
      </div>
    </div>
  );
}
