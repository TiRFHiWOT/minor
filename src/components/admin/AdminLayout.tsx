import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  Home,
  Flag,
  Search,
  AlertTriangle,
  DollarSign,
  FileText,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export const AdminLayout = () => {
  const location = useLocation();
  const { canViewAdminPanel } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!canViewAdminPanel) {
    return (
      <Card className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don't have permission to access the admin panel.
        </p>
        <Button asChild>
          <Link to="/">Return to Forum</Link>
        </Button>
      </Card>
    );
  }

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: BarChart3 },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/content", label: "Content", icon: MessageSquare },
    { path: "/admin/blog", label: "Blog", icon: FileText },
    { path: "/admin/moderation", label: "Moderation", icon: Flag },
    { path: "/admin/spam", label: "Spam Management", icon: AlertTriangle },
    { path: "/admin/seo", label: "SEO", icon: Search },
    { path: "/admin/settings", label: "Settings", icon: Settings },
  ];

  // Sidebar content as a component for reuse
  const SidebarContent = () => (
    <Card className="p-4 h-full flex flex-col rounded-none md:rounded-lg border-0 border-t md:border shadow-xl md:shadow-none">
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Back to Forum</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-500 hidden md:block" />
              <span className="font-semibold hidden md:block">Admin Panel</span>
              {/* Mobile menu button */}
              <button
                className="ml-4 md:hidden p-2 rounded hover:bg-gray-100 focus:outline-none"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ease-in-out ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      >
        <div className={`absolute inset-0 bg-black bg-opacity-80`} />
        <aside
          className={`fixed right-0 top-0 h-full w-[20rem] bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex justify-start gap-2 items-center p-4">
            <Shield className="h-5 w-5 text-red-500" />
            <span className="text-lg font-semibold">Admin Panel</span>
            <button
              className="absolute top-2 right-2 p-2 rounded hover:bg-gray-100 focus:outline-none"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <SidebarContent />
        </aside>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 min-h-[calc(100vh-6rem)]">
          {/* 6rem = header height */}
          {/* Desktop sidebar */}
          <aside className="w-64 hidden md:flex flex-col h-full">
            <SidebarContent />
          </aside>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
