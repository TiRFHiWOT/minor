
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DollarSign
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export const AdminLayout = () => {
  const location = useLocation();
  const { canViewAdminPanel } = usePermissions();

  if (!canViewAdminPanel) {
    return (
      <Card className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
        <Button asChild>
          <Link to="/">Return to Forum</Link>
        </Button>
      </Card>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/content', label: 'Content', icon: MessageSquare },
    { path: '/admin/moderation', label: 'Moderation', icon: Flag },
    { path: '/admin/spam', label: 'Spam Management', icon: AlertTriangle },
    { path: '/admin/advertising', label: 'Advertising', icon: DollarSign },
    { path: '/admin/seo', label: 'SEO', icon: Search },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

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
              <Shield className="h-5 w-5 text-red-500" />
              <span className="font-semibold">Admin Panel</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-64">
            <Card className="p-4">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </Card>
          </aside>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
