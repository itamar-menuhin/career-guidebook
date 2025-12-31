import { cn } from '@/lib/utils';
import { LucideIcon, Zap, Clock, Wrench, Briefcase } from 'lucide-react';

interface BucketTileProps {
  type: 'quick-taste' | 'deeper-dive' | 'hands-on' | 'job-board';
  title: string;
  description: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

const bucketConfig: Record<string, { icon: LucideIcon; colorClass: string; bgClass: string }> = {
  'quick-taste': {
    icon: Zap,
    colorClass: 'text-bucket-quick',
    bgClass: 'bg-bucket-quick/10 hover:bg-bucket-quick/20 border-bucket-quick/30',
  },
  'deeper-dive': {
    icon: Clock,
    colorClass: 'text-bucket-deep',
    bgClass: 'bg-bucket-deep/10 hover:bg-bucket-deep/20 border-bucket-deep/30',
  },
  'hands-on': {
    icon: Wrench,
    colorClass: 'text-bucket-hands',
    bgClass: 'bg-bucket-hands/10 hover:bg-bucket-hands/20 border-bucket-hands/30',
  },
  'job-board': {
    icon: Briefcase,
    colorClass: 'text-bucket-jobs',
    bgClass: 'bg-bucket-jobs/10 hover:bg-bucket-jobs/20 border-bucket-jobs/30',
  },
};

export function BucketTile({ type, title, description, onClick, isActive, className }: BucketTileProps) {
  const config = bucketConfig[type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-6 rounded-xl border-2 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        config.bgClass,
        isActive && 'ring-2 ring-offset-2',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn('p-3 rounded-lg bg-background/80', config.colorClass)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-display text-lg font-semibold mb-1', config.colorClass)}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

export function BucketTileGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {children}
    </div>
  );
}
