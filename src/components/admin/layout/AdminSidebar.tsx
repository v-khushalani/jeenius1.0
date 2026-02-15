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
  Zap,
  Package
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
  { path: '/admin/batches', label: 'Batches', icon: Package },
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

      {/* Sidebar - Apple Minimalistic */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-20 lg:w-72 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#013062]/10 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-[#013062]" />
            </div>
            <div className={cn("transition-opacity", isOpen ? "opacity-100 block" : "hidden lg:block opacity-100")}>
              <h2 className="font-bold text-slate-900 text-base tracking-tight">JEENIUS</h2>
              <p className="text-[9px] text-slate-500 font-medium tracking-wider">ADMIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden absolute right-4 p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 lg:px-4 space-y-0.5 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-slate-100 text-[#013062] shadow-sm border-l-4 border-[#013062]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 transition-all",
                  isActive ? "text-[#013062]" : "text-slate-400"
                )} />
                <span className={cn(
                  "transition-opacity truncate",
                  isOpen ? "opacity-100 inline" : "hidden lg:inline opacity-100"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 lg:p-4 border-t border-slate-200">
          <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest text-center lg:text-left">
            v2.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
