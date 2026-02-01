import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  className?: string;
}

export function AppLayout({ className }: AppLayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {isAuthenticated ? (
        <div className="flex">
          <Sidebar />
          <main
            className={cn(
              'flex-1 transition-all duration-300 ml-64 pt-16',
              className
            )}
          >
            <div className="container mx-auto p-6">
              <Outlet />
            </div>
          </main>
        </div>
      ) : (
        <main className={cn('pt-16', className)}>
          <Outlet />
        </main>
      )}
    </div>
  );
}
