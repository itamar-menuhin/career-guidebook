import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Lock, Copy, Target, Wrench, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useContent } from '@/contexts/ContentContext';
import { Template } from '@/lib/contentTypes';
import { MarkdownPage } from '@/components/MarkdownPage';

export default function TemplatesPage() {
  const { toast } = useToast();
  const { templates, loading } = useContent();

  const handleCopy = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard', description: name });
  };

  const templateStyles: Record<Template['category'] | 'other', { icon: typeof FileText; bg: string; iconColor: string }> = {
    wrap: { icon: FileText, bg: 'bg-primary/10', iconColor: 'text-primary' },
    'focus-area': { icon: Target, bg: 'bg-bucket-deep/10', iconColor: 'text-bucket-deep' },
    tool: { icon: Wrench, bg: 'bg-muted', iconColor: 'text-foreground' },
    other: { icon: Sparkles, bg: 'bg-accent/10', iconColor: 'text-accent' },
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-glow opacity-50" />
        <div className="container max-w-4xl relative">
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">Templates & Tools</h1>
          <p className="text-lg text-muted-foreground">Reference templates for structuring sessions and notes.</p>
        </div>
      </section>

      {/* Templates */}
      <section className="py-8 px-4 pb-20">
        <div className="container max-w-4xl">
          <div className="grid gap-6">
            {loading && templates.length === 0 && (
              <div className="text-muted-foreground text-center py-8">Loading templates...</div>
            )}

            {!loading && templates.length === 0 && (
              <div className="text-muted-foreground text-center py-8">No templates available yet.</div>
            )}

            {templates.map(template => {
              const style = templateStyles[template.category] || templateStyles.other;
              const Icon = style.icon;
              return (
                <Card key={template.id} className="shadow-soft border-border/50 overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${style.iconColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="font-display text-lg">{template.name}</CardTitle>
                            {template.locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                          <CardDescription className="mt-0.5">{template.description}</CardDescription>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopy(template.content, template.name)}
                        className="hidden sm:flex"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <MarkdownPage content={template.content} />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopy(template.content, template.name)}
                        className="sm:hidden absolute top-3 right-3"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
