import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, ArrowLeft, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  
  const pageTitle = routeTitles[location.pathname] || 'Admin';

  return (
    <header className="h-16 bg-background/50 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 hover:bg-accent rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Command Palette Trigger */}
        <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-xl text-sm text-muted-foreground transition-colors">
          <Command className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="ml-4 text-[10px] bg-background px-1.5 py-0.5 rounded border border-border font-mono">⌘K</kbd>
        </button>

        {/* Exit Button */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Exit</span>
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
