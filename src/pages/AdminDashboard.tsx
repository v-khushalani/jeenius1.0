import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import { DashboardOverview } from '@/components/admin/dashboard/DashboardOverview';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { UserManagement } from '@/components/admin/UserManagement';
import ChapterManager from '@/components/admin/ChapterManager';
import TopicManager from '@/components/admin/TopicManager';
import ExamDateManager from '@/components/admin/ExamDateManager';
import { QuestionManager } from '@/components/admin/QuestionManager';
import { NotificationManager } from '@/components/admin/NotificationManager';
import { UserReports } from '@/components/admin/UserReports';
import { PDFQuestionExtractor } from '@/components/admin/PDFQuestionExtractor';
import { ExtractionReviewQueue } from '@/components/admin/ExtractionReviewQueue';
import { AutoTopicAssignment } from '@/components/admin/AutoTopicAssignment';
import { cn } from '@/lib/utils';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getActiveContent = () => {
    switch (location.pathname) {
      case '/admin/analytics':
        return <AdminAnalytics />;
      case '/admin/users':
        return <UserManagement />;
      case '/admin/reports':
        return <UserReports />;
      case '/admin/notifications':
        return <NotificationManager />;
      case '/admin/content':
        return <ChapterManager />;
      case '/admin/topics':
        return <TopicManager />;
      case '/admin/exam-config':
        return <ExamDateManager />;
      case '/admin/questions':
        return <QuestionManager />;
      case '/admin/pdf-extract':
        return <PDFQuestionExtractor />;
      case '/admin/review-queue':
        return <ExtractionReviewQueue />;
      case '/admin/auto-assign':
        return <AutoTopicAssignment />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Apple-style background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#e6eeff] rounded-full -translate-y-1/2 translate-x-1/3 opacity-40" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#e6eeff] rounded-full translate-y-1/2 -translate-x-1/3 opacity-30" />
      </div>

      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className={cn(
        "relative min-h-screen flex flex-col transition-all duration-300",
        "lg:ml-72"
      )}>
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-2 sm:px-4 lg:px-6 max-w-7xl py-3 sm:py-4 lg:py-6">
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {getActiveContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
