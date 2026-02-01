import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 24, text: 'text-xl' },
    lg: { icon: 32, text: 'text-2xl' },
  };

  return (
    <Link to="/" className={cn('flex items-center gap-2', className)}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md" />
        <div className="relative bg-primary rounded-lg p-1.5">
          <Zap className="text-primary-foreground" size={sizes[size].icon} />
        </div>
      </div>
      {showText && (
        <span className={cn('font-bold tracking-tight', sizes[size].text)}>
          Collab<span className="text-primary">Hub</span>
        </span>
      )}
    </Link>
  );
}
