import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface SkillTagProps {
  skill: string;
  onRemove?: () => void;
  className?: string;
  removable?: boolean;
}

export function SkillTag({ skill, onRemove, className, removable = false }: SkillTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
        'bg-primary/10 text-primary border border-primary/20',
        className
      )}
    >
      {skill}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

interface SkillTagListProps {
  skills: string[];
  maxVisible?: number;
  className?: string;
}

export function SkillTagList({ skills, maxVisible = 5, className }: SkillTagListProps) {
  const visibleSkills = skills.slice(0, maxVisible);
  const remainingCount = skills.length - maxVisible;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visibleSkills.map((skill) => (
        <SkillTag key={skill} skill={skill} />
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
