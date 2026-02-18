import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import { UnifiedContentManager } from '@/components/admin/UnifiedContentManager';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { UserManagement } from '@/components/admin/UserManagement';
import ExamDateManager from '@/components/admin/ExamDateManager';
import { NotificationManager } from '@/components/admin/NotificationManager';
import { PDFQuestionExtractor } from '@/components/admin/PDFQuestionExtractor';
import { ExtractionReviewQueue } from '@/components/admin/ExtractionReviewQueue';
import { AutoTopicAssignment } from '@/components/admin/AutoTopicAssignment';
import { DashboardOverview } from '@/components/admin/dashboard/DashboardOverview';
import {
  BarChart3,
  Users,
  BookOpen,
  Settings,
  Bell,
  FileText,
  CheckSquare,
  Zap,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sidebar navigation items
  const sidebarItems: SidebarItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Home className="w-5 h-5" />,
      description: 'Dashboard & Statistics',
    },
    {
      id: 'content',
      label: 'Content Manager',
      icon: <BookOpen className="w-5 h-5" />,
      description: 'Grade → Subject → Chapter → Topic → Questions',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'User Activity & Reports',
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users className="w-5 h-5" />,
      description: 'Manage Users',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      description: 'Send Push Notifications',
    },
    {
      id: 'exam-config',
      label: 'Exam Config',
      icon: <Settings className="w-5 h-5" />,
      description: 'Exam Dates & Settings',
    },
    {
      id: 'pdf-extract',
      label: 'PDF Extractor',
      icon: <FileText className="w-5 h-5" />,
      description: 'Extract Questions from PDFs',
    },
    {
      id: 'review-queue',
      label: 'Review Queue',
      icon: <CheckSquare className="w-5 h-5" />,
      description: 'Review Extracted Content',
    },
    {
      id: 'auto-assign',
      label: 'Auto-Assignment',
      icon: <Zap className="w-5 h-5" />,
      description: 'Automated Topic Assignment',
    },
  ];

  // Get current section from URL
  const currentPath = location.pathname;
  const getCurrentSection = (): string => {
    if (currentPath === '/admin') return 'overview';
    if (currentPath.includes('content')) return 'content';
    if (currentPath.includes('analytics')) return 'analytics';
    if (currentPath.includes('users')) return 'users';
    if (currentPath.includes('notifications')) return 'notifications';
    if (currentPath.includes('exam')) return 'exam-config';
    if (currentPath.includes('pdf')) return 'pdf-extract';
    if (currentPath.includes('review')) return 'review-queue';
    if (currentPath.includes('auto')) return 'auto-assign';
    return 'overview';
  };

  const currentSection = getCurrentSection();

  const handleNavigation = (id: string) => {
    setIsMobileMenuOpen(false);
    switch (id) {
      case 'overview':
        navigate('/admin');
        break;
      case 'content':
        navigate('/admin/content');
        break;
      case 'analytics':
        navigate('/admin/analytics');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'notifications':
        navigate('/admin/notifications');
        break;
      case 'exam-config':
        navigate('/admin/exam-config');
        break;
      case 'pdf-extract':
        navigate('/admin/pdf-extract');
        break;
      case 'review-queue':
        navigate('/admin/review-queue');
        break;
      case 'auto-assign':
        navigate('/admin/auto-assign');
        break;
      default:
        navigate('/admin');
    }
  };

  // Render content based on current section
  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return <DashboardOverview />;
      case 'content':
        return <UnifiedContentManager />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'users':
        return <UserManagement />;
      case 'notifications':
        return <NotificationManager />;
      case 'exam-config':
        return <ExamDateManager />;
      case 'pdf-extract':
        return <PDFQuestionExtractor />;
      case 'review-queue':
        return <ExtractionReviewQueue />;
      case 'auto-assign':
        return <AutoTopicAssignment />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'w-64 bg-white border-r border-slate-200 overflow-y-auto transition-all duration-300 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)]',
            isMobileMenuOpen ? 'fixed left-0 top-16 z-40 w-72' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <nav className="p-4 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={cn(
                  'w-full px-4 py-3 rounded-lg text-left transition-all duration-200 flex items-start gap-3 group',
                  currentSection === item.id
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 transition-colors',
                    currentSection === item.id
                      ? 'text-blue-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  )}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium text-sm transition-colors',
                      currentSection === item.id
                        ? 'text-blue-900'
                        : 'text-slate-700 group-hover:text-slate-900'
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8 pb-20">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
