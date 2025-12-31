import { cn } from '@/lib/utils';
import { LucideIcon, Zap, Clock, Wrench, Briefcase, ChevronRight } from 'lucide-react';

interface BucketTileProps {
  type: 'quick-taste' | 'deeper-dive' | 'hands-on' | 'job-board';
  title: string;
  description: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

const bucketConfig: Record<string, { icon: LucideIcon; colorClass: string; bgClass: string; activeBg: string }> = {
  'quick-taste': {
    icon: Zap,
    colorClass: 'text-bucket-quick',
    bgClass: 'bg-bucket-quick/8 hover:bg-bucket-quick/12 border-bucket-quick/20 hover:border-bucket-quick/40',
    activeBg: 'bg-bucket-quick/15 border-bucket-quick/50',
  },
  'deeper-dive': {
    icon: Clock,
    colorClass: 'text-bucket-deep',
    bgClass: 'bg-bucket-deep/8 hover:bg-bucket-deep/12 border-bucket-deep/20 hover:border-bucket-deep/40',
    activeBg: 'bg-bucket-deep/15 border-bucket-deep/50',
  },
  'hands-on': {
    icon: Wrench,
    colorClass: 'text-bucket-hands',
    bgClass: 'bg-bucket-hands/8 hover:bg-bucket-hands/12 border-bucket-hands/20 hover:border-bucket-hands/40',
    activeBg: 'bg-bucket-hands/15 border-bucket-hands/50',
  },
  'job-board': {
    icon: Briefcase,
    colorClass: 'text-bucket-jobs',
    bgClass: 'bg-bucket-jobs/8 hover:bg-bucket-jobs/12 border-bucket-jobs/20 hover:border-bucket-jobs/40',
    activeBg: 'bg-bucket-jobs/15 border-bucket-jobs/50',
  },
};

export function BucketTile({ type, title, description, onClick, isActive, className }: BucketTileProps) {
  const config = bucketConfig[type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full p-5 md:p-6 rounded-2xl border text-left transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive ? config.activeBg : config.bgClass,
        isActive && 'shadow-soft',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          'p-3 rounded-xl bg-background/80 shadow-xs transition-transform duration-300',
          'group-hover:scale-105',
          config.colorClass
        )}>
          <Icon className="h-5 w-5 md:h-6 md:w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={cn(
              'font-display text-base md:text-lg font-medium mb-1.5 transition-colors',
              config.colorClass
            )}>
              {title}
            </h3>
            <ChevronRight className={cn(
              'h-4 w-4 transition-all duration-300',
              config.colorClass,
              isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0'
            )} />
          </div>
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
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4', className)}>
      {children}
    </div>
  );
}
