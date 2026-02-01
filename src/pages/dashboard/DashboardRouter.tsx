import { useAuth } from '@/contexts/AuthContext';
import { FounderDashboard } from './FounderDashboard';
import { TalentDashboard } from './TalentDashboard';
import { InvestorDashboard } from './InvestorDashboard';
import { LoadingPage } from '@/components/shared/LoadingSpinner';

export function DashboardRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage message="Loading your dashboard..." />;
  }

  if (!user) {
    return null;
  }

  switch (user.role) {
    case 'founder':
      return <FounderDashboard />;
    case 'talent':
      return <TalentDashboard />;
    case 'investor':
      return <InvestorDashboard />;
    default:
      return <TalentDashboard />;
  }
}
