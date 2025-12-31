import { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  NotebookPen, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ExternalLink,
  Download,
  Copy,
  Share2,
  X,
  Link as LinkIcon,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  exportSessionAsMarkdown, 
  downloadMarkdown, 
  copyToClipboard,
  shareSession 
} from '@/lib/sessionStore';

interface SessionNotesDrawerProps {
  className?: string;
}

export function SessionNotesDrawer({ className }: SessionNotesDrawerProps) {
  const { 
    session, 
    isActive,
    updateSnapshot,
    addPromisingDirection,
    updatePromisingDirection,
    removePromisingDirection,
    addNextStep,
    removeNextStep,
    updateFollowUpPlan,
    addFirstSmallStep,
  } = useSession();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [newStep, setNewStep] = useState('');
  const [expandedDirections, setExpandedDirections] = useState<Record<string, boolean>>({});
  const [newLinkInputs, setNewLinkInputs] = useState<Record<string, { label: string; url: string }>>({});
  const [newPersonInputs, setNewPersonInputs] = useState<Record<string, string>>({});
  const [newSmallStepInputs, setNewSmallStepInputs] = useState<Record<string, string>>({});

  if (!isActive || !session) {
    return null;
  }

  const { notes } = session;

  const handleExport = () => {
    const md = exportSessionAsMarkdown(session);
    downloadMarkdown(md, `session-${new Date().toISOString().split('T')[0]}.md`);
    toast({ title: 'Session exported', description: 'Downloaded as markdown file' });
  };

  const handleCopy = async () => {
    const md = exportSessionAsMarkdown(session);
    await copyToClipboard(md);
    toast({ title: 'Copied to clipboard' });
  };

  const handleShare = () => {
    const slug = shareSession(session);
    const url = `${window.location.origin}/s/${slug}`;
    copyToClipboard(url);
    toast({ 
      title: 'Share link created', 
      description: 'Link copied to clipboard. Anyone with this link can view the session.',
    });
  };

  const handleAddNextStep = () => {
    if (newStep.trim()) {
      addNextStep(newStep);
      setNewStep('');
    }
  };

  const toggleDirection = (id: string) => {
    setExpandedDirections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddLink = (directionId: string) => {
    const input = newLinkInputs[directionId];
    if (input?.label && input?.url) {
      updatePromisingDirection(directionId, {
        links: [...(notes.promisingDirections.find(d => d.id === directionId)?.links || []), input],
      });
      setNewLinkInputs(prev => ({ ...prev, [directionId]: { label: '', url: '' } }));
    }
  };

  const handleAddPerson = (directionId: string) => {
    const person = newPersonInputs[directionId];
    if (person?.trim()) {
      const direction = notes.promisingDirections.find(d => d.id === directionId);
      if (direction) {
        updatePromisingDirection(directionId, {
          peopleToTalkTo: [...direction.peopleToTalkTo, person.trim()],
        });
        setNewPersonInputs(prev => ({ ...prev, [directionId]: '' }));
      }
    }
  };

  const handleAddSmallStep = (directionId: string) => {
    const step = newSmallStepInputs[directionId];
    if (step?.trim()) {
      addFirstSmallStep(directionId, step.trim());
      setNewSmallStepInputs(prev => ({ ...prev, [directionId]: '' }));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn('fixed bottom-4 right-4 z-40 shadow-elevated gap-2', className)}
        >
          <NotebookPen className="h-4 w-4" />
          Session Notes
          {notes.promisingDirections.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {notes.promisingDirections.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display">Session Notes</SheetTitle>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={handleCopy} title="Copy to clipboard">
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleExport} title="Download as markdown">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleShare} title="Create share link">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Snapshot Section */}
            <section className="space-y-3">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Snapshot
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Current Situation</label>
                  <Textarea
                    value={notes.snapshot.currentSituation}
                    onChange={(e) => updateSnapshot('currentSituation', e.target.value)}
                    placeholder="Where are they now?"
                    className="mt-1 min-h-[60px]"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Aiming For</label>
                  <Textarea
                    value={notes.snapshot.aimingFor}
                    onChange={(e) => updateSnapshot('aimingFor', e.target.value)}
                    placeholder="What does success look like?"
                    className="mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Must-Haves</label>
                  <Textarea
                    value={notes.snapshot.mustHaves.join('\n')}
                    onChange={(e) => updateSnapshot('mustHaves', e.target.value.split('\n').filter(Boolean))}
                    placeholder="One per line"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Constraints</label>
                  <Textarea
                    value={notes.snapshot.constraints.join('\n')}
                    onChange={(e) => updateSnapshot('constraints', e.target.value.split('\n').filter(Boolean))}
                    placeholder="One per line"
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* Promising Directions */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Promising Directions
                </h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => addPromisingDirection()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {notes.promisingDirections.map((direction, index) => (
                  <Collapsible 
                    key={direction.id}
                    open={expandedDirections[direction.id]}
                    onOpenChange={() => toggleDirection(direction.id)}
                  >
                    <div className="border rounded-lg p-3 bg-card">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{index + 1}</Badge>
                            <Input
                              value={direction.title}
                              onChange={(e) => updatePromisingDirection(direction.id, { title: e.target.value })}
                              placeholder="Direction title"
                              className="border-0 p-0 h-auto font-medium focus-visible:ring-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePromisingDirection(direction.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <ChevronDown className={cn(
                              'h-4 w-4 transition-transform',
                              expandedDirections[direction.id] && 'rotate-180'
                            )} />
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="pt-3 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Why Promising</label>
                          <Textarea
                            value={direction.whyPromising}
                            onChange={(e) => updatePromisingDirection(direction.id, { whyPromising: e.target.value })}
                            placeholder="Why does this direction make sense?"
                            className="mt-1 min-h-[60px]"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground">First Small Steps (≤60 min)</label>
                          <div className="space-y-1 mt-1">
                            {direction.firstSmallSteps.map((step, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="flex-1">• {step}</span>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <Input
                                value={newSmallStepInputs[direction.id] || ''}
                                onChange={(e) => setNewSmallStepInputs(prev => ({ ...prev, [direction.id]: e.target.value }))}
                                placeholder="Add step..."
                                className="text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSmallStep(direction.id)}
                              />
                              <Button size="sm" variant="outline" onClick={() => handleAddSmallStep(direction.id)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Links</label>
                          <div className="space-y-1 mt-1">
                            {direction.links.map((link, i) => (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {link.label}
                              </a>
                            ))}
                            <div className="flex gap-2">
                              <Input
                                value={newLinkInputs[direction.id]?.label || ''}
                                onChange={(e) => setNewLinkInputs(prev => ({ 
                                  ...prev, 
                                  [direction.id]: { ...prev[direction.id], label: e.target.value } 
                                }))}
                                placeholder="Label"
                                className="text-sm flex-1"
                              />
                              <Input
                                value={newLinkInputs[direction.id]?.url || ''}
                                onChange={(e) => setNewLinkInputs(prev => ({ 
                                  ...prev, 
                                  [direction.id]: { ...prev[direction.id], url: e.target.value } 
                                }))}
                                placeholder="URL"
                                className="text-sm flex-1"
                              />
                              <Button size="sm" variant="outline" onClick={() => handleAddLink(direction.id)}>
                                <LinkIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground">People to Talk To</label>
                          <div className="space-y-1 mt-1">
                            {direction.peopleToTalkTo.map((person, i) => (
                              <div key={i} className="text-sm">• {person}</div>
                            ))}
                            <div className="flex gap-2">
                              <Input
                                value={newPersonInputs[direction.id] || ''}
                                onChange={(e) => setNewPersonInputs(prev => ({ ...prev, [direction.id]: e.target.value }))}
                                placeholder="Add person/intro..."
                                className="text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPerson(direction.id)}
                              />
                              <Button size="sm" variant="outline" onClick={() => handleAddPerson(direction.id)}>
                                <UserPlus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </section>

            {/* Closing */}
            <section className="space-y-3">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Closing
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Next Steps</label>
                  <div className="space-y-1 mt-1">
                    {notes.closing.nextSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm group">
                        <span className="flex-1">• {step}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => removeNextStep(i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newStep}
                        onChange={(e) => setNewStep(e.target.value)}
                        placeholder="Add next step..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNextStep()}
                      />
                      <Button size="sm" variant="outline" onClick={handleAddNextStep}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Follow-up Plan</label>
                  <Textarea
                    value={notes.closing.followUpPlan}
                    onChange={(e) => updateFollowUpPlan(e.target.value)}
                    placeholder="When and how to follow up?"
                    className="mt-1"
                  />
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ When sharing: avoid including sensitive personal details
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
