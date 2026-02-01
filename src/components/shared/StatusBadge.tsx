import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StatusType = 
  | 'pending' 
  | 'active' 
  | 'completed' 
  | 'rejected' 
  | 'accepted' 
  | 'shortlisted'
  | 'reviewing'
  | 'open'
  | 'filled'
  | 'in-progress'
  | 'verified'
  | 'hiring'
  | 'paused'
  | 'delayed'
  | 'funded'
  | 'closed';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  active: { label: 'Active', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  accepted: { label: 'Accepted', variant: 'success' },
  shortlisted: { label: 'Shortlisted', variant: 'secondary' },
  reviewing: { label: 'Reviewing', variant: 'secondary' },
  open: { label: 'Open', variant: 'success' },
  filled: { label: 'Filled', variant: 'default' },
  'in-progress': { label: 'In Progress', variant: 'secondary' },
  verified: { label: 'Verified', variant: 'success' },
  hiring: { label: 'Hiring', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  delayed: { label: 'Delayed', variant: 'destructive' },
  funded: { label: 'Funded', variant: 'success' },
  closed: { label: 'Closed', variant: 'destructive' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'default' };

  return (
    <Badge variant={config.variant} className={cn('capitalize', className)}>
      {config.label}
    </Badge>
  );
}
