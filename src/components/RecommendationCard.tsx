import { RecommendationCard as CardType } from '@/lib/contentTypes';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buildCardAnchor } from '@/lib/anchors';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ExternalLink, 
  ChevronDown, 
  Zap, 
  Clock, 
  Wrench, 
  Briefcase,
  Check,
  Sparkles,
  Copy,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RecommendationCardProps {
  card: CardType;
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
  compact = false,
  className 
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const TypeIcon = typeIcons[card.tags.type];

  const handleCopyFirstStep = () => {
    navigator.clipboard.writeText(card.firstSmallStep);
    toast({
      title: 'Copied to clipboard',
      description: 'First step ready to paste',
    });
  };

  if (compact) {
    return (
      <Card
        className={cn('card-shine shadow-soft hover:shadow-card transition-all duration-300 border-border/50', className)}
        id={buildCardAnchor(card.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-display font-medium">{card.title}</CardTitle>
            <Badge variant="outline" className={cn('shrink-0 text-xs', typeColors[card.tags.type])}>
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
    <Card
      className={cn('card-shine shadow-soft hover:shadow-card transition-all duration-300 border-border/50', className)}
      id={buildCardAnchor(card.id)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn('text-xs font-medium', typeColors[card.tags.type])}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {card.tags.type.replace('-', ' ')}
            </Badge>
            <Badge variant="outline" className="capitalize text-xs">
              {card.tags.topic.replace('-', ' ')}
            </Badge>
            <Badge variant="outline" className={cn('text-xs', commitmentColors[card.tags.commitment])}>
              {card.tags.commitment} commitment
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg font-display font-medium mt-3">{card.title}</CardTitle>
        <CardDescription className="text-[15px] leading-relaxed">{card.oneLiner}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* When to suggest */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium flex items-center gap-2">
            <Check className="h-4 w-4 text-commitment-low" />
            When to suggest
          </p>
          <p className="text-sm text-muted-foreground pl-6 leading-relaxed">{card.whenToSuggest}</p>
        </div>

        {/* Good fit if */}
        <div className="space-y-2.5">
          <p className="text-sm font-medium">Good fit if:</p>
          <div className="flex flex-wrap gap-2">
            {card.tags.goodFitIf.map((fit, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal px-2.5 py-1">
                {fit}
              </Badge>
            ))}
          </div>
        </div>

        {/* First small step */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-primary">First Small Step (≤60 min)</p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleCopyFirstStep} className="h-7 px-2">
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
          <p className="text-sm leading-relaxed">{card.firstSmallStep}</p>
        </div>

        {/* Expandable details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-muted/50">
              <span className="text-muted-foreground">{isExpanded ? 'Show less' : 'Show more details'}</span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-5 pt-4 animate-fade-in">
            {/* When not to suggest */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-destructive/80">When NOT to suggest</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.whenNotToSuggest}</p>
            </div>

            {/* Next step */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Next Step</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.nextStep}</p>
            </div>

            {/* Links */}
            {card.links.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-sm font-medium">Links</p>
                <div className="flex flex-wrap gap-2">
                  {card.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* People to talk to */}
            {card.peopleToTalkTo && card.peopleToTalkTo.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-sm font-medium">People to talk to</p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  {card.peopleToTalkTo.map((person, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {person}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Internal notes */}
            {card.internalNotes && (
              <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Internal Notes</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.internalNotes}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
