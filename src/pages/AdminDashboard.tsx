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
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className={cn(
        "min-h-screen flex flex-col transition-all duration-300",
        "lg:ml-64" // Sidebar width on desktop
      )}>
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {getActiveContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
