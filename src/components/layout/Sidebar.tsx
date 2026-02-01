import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  Bookmark,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  BarChart3,
  Target,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  roles?: UserRole[];
}

const founderNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Startups', href: '/startups', icon: Building2 },
  { label: 'Team', href: '/team', icon: Users },
  { label: 'Applications', href: '/applications', icon: FileText, badge: 3 },
  { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 2 },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Discover', href: '/discover/talents', icon: Search },
];

const talentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Browse Startups', href: '/discover/startups', icon: Search },
  { label: 'My Applications', href: '/applications', icon: FileText },
  { label: 'Saved', href: '/saved', icon: Bookmark },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Profile', href: '/profile', icon: Users },
];

const investorNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Discover', href: '/discover/startups', icon: Search },
  { label: 'Portfolio', href: '/portfolio', icon: TrendingUp },
  { label: 'Saved', href: '/saved', icon: Bookmark },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Deals', href: '/deals', icon: Target },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

const navItemsByRole: Record<UserRole, NavItem[]> = {
  founder: founderNavItems,
  talent: talentNavItems,
  investor: investorNavItems,
  guest: [],
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || 'guest';
  const navItems = navItemsByRole[role];

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Collapse Toggle */}
          <div className="flex justify-end p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Main Navigation */}
          <ScrollArea className="flex-1 px-2">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                const NavLink = (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        {item.label}
                        {item.badge && (
                          <Badge variant="secondary" className="h-4 min-w-4 p-0 text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return NavLink;
              })}
            </nav>
          </ScrollArea>

          {/* Bottom Navigation */}
          <div className="border-t p-2">
            <nav className="flex flex-col gap-1">
              {bottomNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                const NavLink = (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return NavLink;
              })}
            </nav>

            {/* Pro Upgrade Card */}
            {!collapsed && (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Go Pro</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Unlock advanced features and boost your visibility.
                </p>
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
