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
  Settings,
  Sparkles,
  Shield,
  X,
  ChevronDown,
  Layers
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    items: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    ]
  },
  {
    title: 'User Management',
    icon: Users,
    items: [
      { path: '/admin/users', label: 'All Users', icon: Users },
      { path: '/admin/reports', label: 'Reports', icon: FileText },
    ]
  },
  {
    title: 'Content',
    icon: BookOpen,
    items: [
      { path: '/admin/content', label: 'Chapters', icon: BookOpen },
      { path: '/admin/topics', label: 'Topics', icon: Layers },
      { path: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
    ]
  },
  {
    title: 'Question Tools',
    icon: Upload,
    items: [
      { path: '/admin/pdf-extract', label: 'PDF Extractor', icon: Upload },
      { path: '/admin/review-queue', label: 'Review Queue', icon: ClipboardCheck },
      { path: '/admin/auto-assign', label: 'Auto-Assignment', icon: Brain },
    ]
  },
  {
    title: 'Settings',
    icon: Settings,
    items: [
      { path: '/admin/notifications', label: 'Notifications', icon: Bell },
      { path: '/admin/exam-config', label: 'Exam Dates', icon: Calendar },
    ]
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActiveGroup = (group: NavGroup) => {
    return group.items.some(item => location.pathname === item.path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 flex flex-col transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">JEEnius Admin</h2>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Control Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navGroups.map((group) => (
            <Collapsible 
              key={group.title} 
              defaultOpen={isActiveGroup(group)}
              className="space-y-1"
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors group">
                <div className="flex items-center gap-2.5">
                  <group.icon className="w-4 h-4" />
                  <span>{group.title}</span>
                </div>
                <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 pl-4">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-3.5 border border-primary/20">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">Admin Mode Active</p>
                <p className="text-[10px] text-muted-foreground">Full system access</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
