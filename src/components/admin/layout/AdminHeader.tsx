import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, ArrowLeft, Command, Eye, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/analytics': 'Analytics',
  '/admin/users': 'Users',
  '/admin/reports': 'Reports',
  '/admin/notifications': 'Notifications',
  '/admin/content': 'Chapters',
  '/admin/topics': 'Topics',
  '/admin/exam-config': 'Exam Config',
  '/admin/questions': 'Question Bank',
  '/admin/pdf-extract': 'PDF Extractor',
  '/admin/review-queue': 'Review Queue',
  '/admin/auto-assign': 'Auto-Assignment',
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  
  const pageTitle = routeTitles[location.pathname] || 'Admin';

  const handleViewAsUser = () => {
    // Open user study page in new tab to avoid admin redirect
    window.open('/study-now', '_blank');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-16 lg:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
        >
          <Menu className="w-5 h-5" />
          <span className="text-sm font-medium">Menu</span>
        </button>
        
        <div className="flex items-center gap-4">
          <h1 className="text-lg lg:text-2xl font-bold text-slate-900 tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        {/* View as User Button */}
        <button
          type="button"
          onClick={handleViewAsUser}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden lg:inline">View as User</span>
        </button>

        {/* Logout Button */}
        <button 
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
