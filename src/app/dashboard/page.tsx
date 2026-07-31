/**
 * Dashboard Page (Module 7-8)
 * 
 * This page will show:
 * - List of saved CVs
 * - Create new CV button
 * - Recent uploads
 * - Quick actions
 * 
 * Currently a placeholder - will implement when we add database
 */

import Link from "next/link";
import { Plus, FileText, Clock } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My CVs</h1>
          <p className="mt-1 text-gray-600">
            Manage and edit your saved CVs
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New CV
        </Link>
      </div>

      {/* Empty state */}
      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No CVs yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          Upload your first CV screenshot to get started. All your CVs will
          appear here.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Upload CV
        </Link>
      </div>

      {/* Coming soon section */}
      <div className="mt-12 rounded-lg bg-gray-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <p className="text-sm text-gray-600">
          Your recent uploads and edits will appear here once we add database
          storage in Module 7.
        </p>
      </div>

      {/* Info box */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Coming in Modules 7-9
        </h4>
        <p className="text-sm text-blue-700">
          The dashboard will display all your saved CVs with database
          persistence, cloud storage for images, and user authentication.
        </p>
      </div>
    </div>
  );
}
