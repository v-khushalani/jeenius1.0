import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/admin': { title: 'Dashboard', subtitle: 'Overview & Quick Stats' },
  '/admin/analytics': { title: 'Analytics', subtitle: 'Platform Insights & Metrics' },
  '/admin/users': { title: 'User Management', subtitle: 'Manage All Users' },
  '/admin/reports': { title: 'Reports', subtitle: 'Export & Analysis' },
  '/admin/notifications': { title: 'Notifications', subtitle: 'Send Announcements' },
  '/admin/content': { title: 'Chapters', subtitle: 'Content Management' },
  '/admin/topics': { title: 'Topics', subtitle: 'Topic Management' },
  '/admin/exam-config': { title: 'Exam Configuration', subtitle: 'Configure Exam Dates' },
  '/admin/questions': { title: 'Question Bank', subtitle: 'Manage Questions' },
  '/admin/pdf-extract': { title: 'PDF Extractor', subtitle: 'Extract Questions from PDFs' },
  '/admin/review-queue': { title: 'Review Queue', subtitle: 'Review Extracted Questions' },
  '/admin/auto-assign': { title: 'Auto-Assignment', subtitle: 'NLP-Based Topic Assignment' },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const pageInfo = routeTitles[location.pathname] || routeTitles['/admin'];

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-foreground">{pageInfo.title}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Search - Hidden on mobile */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-9 w-64 h-9 bg-accent/50 border-transparent focus:border-border"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-accent">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuItem onClick={() => navigate('/dashboard')}>
              <LogOut className="mr-2 h-4 w-4" />
              Exit Admin
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AdminHeader;
