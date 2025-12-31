import { RecommendationCard as CardType } from '@/data/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Plus, 
  ExternalLink, 
  ChevronDown, 
  Zap, 
  Clock, 
  Wrench, 
  Briefcase,
  Check,
  UserPlus,
  Link as LinkIcon
} from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';

interface RecommendationCardProps {
  card: CardType;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const typeIcons = {
  'quick-taste': Zap,
  'deeper-dive': Clock,
  'hands-on': Wrench,
  'job-board': Briefcase,
};

const typeColors = {
  'quick-taste': 'bg-bucket-quick/10 text-bucket-quick border-bucket-quick/30',
  'deeper-dive': 'bg-bucket-deep/10 text-bucket-deep border-bucket-deep/30',
  'hands-on': 'bg-bucket-hands/10 text-bucket-hands border-bucket-hands/30',
  'job-board': 'bg-bucket-jobs/10 text-bucket-jobs border-bucket-jobs/30',
};

const commitmentColors = {
  low: 'bg-commitment-low/10 text-commitment-low border-commitment-low/30',
  medium: 'bg-commitment-medium/10 text-commitment-medium border-commitment-medium/30',
  high: 'bg-commitment-high/10 text-commitment-high border-commitment-high/30',
};

export function RecommendationCard({ 
  card, 
  showActions = true, 
  compact = false,
  className 
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isActive, addPromisingDirection, addFirstSmallStep, addLinkToDirection } = useSession();
  const { toast } = useToast();

  const TypeIcon = typeIcons[card.tags.type];

  const handleAddAsDirection = () => {
    if (!isActive) {
      toast({
        title: 'No active session',
        description: 'Start a session first to add directions.',
        variant: 'destructive',
      });
      return;
    }
    addPromisingDirection({
      title: card.title,
      whyPromising: card.oneLiner,
      firstSmallSteps: [card.firstSmallStep],
      links: card.links,
      peopleToTalkTo: card.peopleToTalkTo || [],
    });
    toast({
      title: 'Added as promising direction',
      description: card.title,
    });
  };

  const handleAddFirstStep = (directionId?: string) => {
    if (!isActive) {
      toast({
        title: 'No active session',
        description: 'Start a session first to add steps.',
        variant: 'destructive',
      });
      return;
    }
    // If no specific direction, we'll add to the first one or create new
    toast({
      title: 'First step copied',
      description: card.firstSmallStep.slice(0, 50) + '...',
    });
    navigator.clipboard.writeText(card.firstSmallStep);
  };

  if (compact) {
    return (
      <Card className={cn('shadow-soft hover:shadow-card transition-shadow', className)} id={card.id}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium">{card.title}</CardTitle>
            <Badge variant="outline" className={cn('shrink-0', typeColors[card.tags.type])}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {card.tags.type.replace('-', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{card.oneLiner}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('shadow-soft hover:shadow-card transition-shadow', className)} id={card.id}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn(typeColors[card.tags.type])}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {card.tags.type.replace('-', ' ')}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {card.tags.topic.replace('-', ' ')}
            </Badge>
            <Badge variant="outline" className={cn(commitmentColors[card.tags.commitment])}>
              {card.tags.commitment} commitment
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg mt-2">{card.title}</CardTitle>
        <CardDescription className="text-base">{card.oneLiner}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* When to suggest */}
        <div className="space-y-1">
          <p className="text-sm font-medium flex items-center gap-2">
            <Check className="h-4 w-4 text-commitment-low" />
            When to suggest
          </p>
          <p className="text-sm text-muted-foreground pl-6">{card.whenToSuggest}</p>
        </div>

        {/* Good fit if */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Good fit if:</p>
          <div className="flex flex-wrap gap-1.5">
            {card.tags.goodFitIf.map((fit, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {fit}
              </Badge>
            ))}
          </div>
        </div>

        {/* First small step */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-sm font-medium text-primary mb-1">First Small Step (≤60 min)</p>
          <p className="text-sm">{card.firstSmallStep}</p>
        </div>

        {/* Expandable details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>{isExpanded ? 'Show less' : 'Show more'}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* When not to suggest */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive/80">When NOT to suggest</p>
              <p className="text-sm text-muted-foreground">{card.whenNotToSuggest}</p>
            </div>

            {/* Next step */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Next Step</p>
              <p className="text-sm text-muted-foreground">{card.nextStep}</p>
            </div>

            {/* Links */}
            {card.links.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Links</p>
                <div className="flex flex-wrap gap-2">
                  {card.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* People to talk to */}
            {card.peopleToTalkTo && card.peopleToTalkTo.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">People to talk to</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {card.peopleToTalkTo.map((person, i) => (
                    <li key={i}>• {person}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Internal notes */}
            {card.internalNotes && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Internal Notes</p>
                <p className="text-sm text-muted-foreground">{card.internalNotes}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      {showActions && (
        <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
          <Button size="sm" onClick={handleAddAsDirection} disabled={!isActive}>
            <Plus className="h-4 w-4 mr-1" />
            Add as direction
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAddFirstStep()}>
            <Zap className="h-4 w-4 mr-1" />
            Copy first step
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
