"use client";

import Link from "next/link";
import {
  ArrowRight,
  Upload,
  Edit,
  Sparkles,
  Eye,
  Palette,
  FileType,
  Lock,
  Award,
  CheckCircle2,
  MousePointer2,
  FileSearch,
  Wand2
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50/50 py-20 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm animate-fade-in-up">
              <Sparkles className="h-4 w-4 text-blue-500" />
              100% Free • No Credit Card Required
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              Turn Any CV Into an
              <span className="block bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mt-2">
                Editable Resume
              </span>
            </h1>

            <p className="mt-6 text-xl leading-relaxed text-gray-600 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              Upload a screenshot of any CV template, and our AI will extract the
              layout and content. Edit freely, customize everything, and export in seconds.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <Link
                href="/upload"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/30 hover:-translate-y-1 transition-all duration-300"
              >
                <Upload className="h-5 w-5 group-hover:animate-bounce" />
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/editor"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-8 py-4 text-base font-bold text-gray-700 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300"
              >
                <MousePointer2 className="h-5 w-5" />
                Try Demo
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No signup required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Works in browser
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Free forever
              </span>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-300 to-blue-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="bg-white py-24 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three simple steps to convert any CV into an editable format
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                icon: Upload,
                step: "1",
                title: "Upload Screenshot",
                description: "Take a screenshot of any CV template or design you like and upload it to our platform.",
                color: "blue",
              },
              {
                icon: Wand2,
                step: "2",
                title: "AI Extraction",
                description: "Our AI extracts text and layout automatically using advanced OCR technology.",
                color: "purple",
              },
              {
                icon: Edit,
                step: "3",
                title: "Edit & Export",
                description: "Customize everything to your liking and export to PDF, Word, or HTML.",
                color: "green",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-b from-white to-gray-50/50 p-8 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border-2 border-gray-100 text-sm font-bold text-gray-900 group-hover:scale-110 transition-transform">
                  {item.step}
                </div>

                <div className={`
                  flex h-14 w-14 items-center justify-center rounded-xl mb-6 
                  ${item.color === "blue" ? "bg-blue-100 text-blue-600" : ""}
                  ${item.color === "purple" ? "bg-purple-100 text-purple-600" : ""}
                  ${item.color === "green" ? "bg-green-100 text-green-600" : ""}
                  group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
                `}>
                  <item.icon className="h-7 w-7" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              Everything You Need
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Professional-grade features, completely free
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileSearch,
                title: "OCR Text Extraction",
                description: "Extract text from any CV image with high accuracy using Tesseract.js",
              },
              {
                icon: Eye,
                title: "Layout Detection",
                description: "Automatically identify sections and structure of your CV",
              },
              {
                icon: Palette,
                title: "Full Customization",
                description: "Edit fonts, colors, spacing, and everything else to match your style",
              },
              {
                icon: FileType,
                title: "Multiple Formats",
                description: "Export to PDF, Word, HTML, and JSON for any use case",
              },
              {
                icon: Lock,
                title: "Privacy First",
                description: "All processing happens locally in your browser - no data sent to servers",
              },
              {
                icon: Award,
                title: "No Watermarks",
                description: "Clean, professional exports every time without any branding",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-y border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "100%", label: "Free to Use" },
              { value: "0", label: "Data Stored" },
              { value: "5s", label: "Avg. Processing" },
              { value: "∞", label: "CVs Unlimited" },
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Ready to Create Your CV?
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              Start extracting and editing CVs for free today. No signup required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/upload"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-blue-600 shadow-xl hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Upload Your First CV
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
