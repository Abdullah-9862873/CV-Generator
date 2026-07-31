"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Upload, Layout, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: FileText,
  },
  {
    href: "/upload",
    label: "Upload CV",
    icon: Upload,
  },
  {
    href: "/editor",
    label: "Editor",
    icon: Layout,
  },
  {
    href: "/dashboard",
    label: "My CVs",
    icon: User,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-16 items-center">
        <Link
          href="/"
          className="group flex items-center gap-2 mr-8 transition-transform duration-200 hover:scale-105"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-600/40 group-hover:scale-110">
            <FileText className="h-5 w-5 text-white transition-transform duration-300 group-hover:rotate-6" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-3 w-3 text-yellow-300 animate-pulse" />
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            CV Generator
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ease-out",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                  "hover:scale-105",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-all duration-300",
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-blue-500 group-hover:scale-110"
                  )}
                />
                <span className="hidden sm:inline">{item.label}</span>

                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-600 animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 text-xs font-medium text-green-700 border border-green-200 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Free & Open Source
          </span>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
