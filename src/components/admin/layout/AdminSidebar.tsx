import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  HelpCircle, 
  Upload, 
  ClipboardCheck,
  Brain,
  TrendingUp,
  FileText,
  Bell,
  Calendar,
  Layers,
  X,
  Zap
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
  { path: '/admin/content', label: 'Chapters', icon: BookOpen },
  { path: '/admin/topics', label: 'Topics', icon: Layers },
  { path: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { path: '/admin/pdf-extract', label: 'PDF Extract', icon: Upload },
  { path: '/admin/review-queue', label: 'Review', icon: ClipboardCheck },
  { path: '/admin/auto-assign', label: 'Auto-Assign', icon: Brain },
  { path: '/admin/notifications', label: 'Notify', icon: Bell },
  { path: '/admin/exam-config', label: 'Exams', icon: Calendar },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/80 backdrop-blur-md z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Minimal Dark */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-20 lg:w-64 bg-primary z-50 flex flex-col transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-primary-foreground/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0 lg:opacity-100")}>
              <h2 className="font-black text-primary-foreground text-lg tracking-tight">JEENIUS</h2>
              <p className="text-[10px] text-primary-foreground/50 font-medium tracking-[0.2em]">ADMIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden absolute right-4 p-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 lg:px-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary-foreground text-primary"
                    : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "transition-opacity truncate",
                  isOpen ? "opacity-100" : "opacity-0 lg:opacity-100"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary-foreground/10">
          <div className={cn(
            "text-center lg:text-left",
            isOpen ? "text-left" : ""
          )}>
            <p className={cn(
              "text-[10px] text-primary-foreground/40 font-medium tracking-wider",
              isOpen ? "block" : "hidden lg:block"
            )}>
              v2.0 BETA
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
