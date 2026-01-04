import { Card, CardContent } from '@/components/ui/card';
import { Target, FileText, Wrench, Sparkles, Lock } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { Template } from '@/lib/contentTypes';
import { MarkdownPage } from '@/components/MarkdownPage';
import { useMemo } from 'react';

// Helper to split content by level
function splitContent(text: string, level: string): { title: string; content: string }[] {
  const lines = text.split('\n');
  const sections: { title: string; content: string }[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  const flush = () => {
    const trimmed = currentLines.join('\n').trim();
    if (currentTitle || trimmed) {
      sections.push({ title: currentTitle, content: trimmed });
    }
  };

  lines.forEach(line => {
    if (line.startsWith(level + ' ')) {
      flush();
      currentTitle = line.replace(level + ' ', '').trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  });
  flush();

  return sections;
}

function InnerSectionRenderer({ content }: { content: string }) {
  // Split by ### (Level 3)
  const subSections = useMemo(() => splitContent(content, '###'), [content]);

  return (
    <div className="space-y-6">
      {subSections.map((sub, idx) => {
        // If it looks like a subsection (has title), box it.
        // If it's just intro text (no title, first item), leave it plain?
        // User wants "inner box", so let's box everything that has a title.

        if (!sub.title && idx === 0) {
          // Intro text before first ###
          return <MarkdownPage key={idx} content={sub.content} className="prose-p:text-lg prose-p:text-muted-foreground prose-li:text-lg prose-li:text-muted-foreground mb-6" />;
        }

        return (
          <div key={idx} className="bg-background/60 rounded-xl p-5 md:p-6 border border-border/40 shadow-sm ml-2 md:ml-4">
            {sub.title && (
              <h3 className="font-display text-xl text-foreground font-medium mb-4">
                {sub.title}
              </h3>
            )}
            <MarkdownPage content={sub.content} className="prose-p:text-lg prose-p:text-muted-foreground prose-li:text-lg prose-li:text-muted-foreground" />
          </div>
        );
      })}
    </div>
  );
}

// Custom renderer to split markdown into aesthetic sections
function AestheticTemplateView({ content }: { content: string }) {
  const parsed = useMemo(() => {
    // Split by ## (Level 2)
    const rawSections = splitContent(content, '##');
    // First item might be title (if starts with #) or just sections if we assume ## structure
    // But our file has # Title then ## Section.
    // Let's manually parse the H1 separate from the rest.

    // Quick H1 extraction
    const lines = content.split('\n');
    const h1Line = lines.find(l => l.startsWith('# '));
    const mainTitle = h1Line ? h1Line.replace('# ', '').trim() : '';

    // Remove H1 line from content for processing
    const contentBody = lines.filter(l => !l.startsWith('# ')).join('\n');
    const sections = splitContent(contentBody, '##');

    return { mainTitle, sections };
  }, [content]);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Centered Main Title */}
      {parsed.mainTitle && (
        <div className="text-center mb-8 px-4">
          <h1 className="font-display text-3xl md:text-4xl text-foreground font-medium decoration-clone">
            {parsed.mainTitle}
          </h1>
          <div className="w-16 h-1 bg-primary/20 mx-auto mt-4 rounded-full" />
        </div>
      )}

      {/* Sections Grid */}
      <div className="grid gap-8">
        {parsed.sections.map((section, idx) => (
          <section
            key={idx}
            className="rounded-2xl border border-border/40 bg-muted/20 p-6 md:p-8 hover:bg-muted/30 transition-colors duration-300"
          >
            {section.title && (
              <h2 className="font-display text-2xl text-primary font-semibold mb-6 flex items-center gap-2">
                {section.title}
              </h2>
            )}
            <div className="pl-1 md:pl-2">
              <InnerSectionRenderer content={section.content} />
            </div>
          </section>
        ))}

        {parsed.sections.length === 0 && (
          <div className="p-4 text-center text-muted-foreground italic">
            No sections detected.
          </div>
        )}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const { templates, loading } = useContent();

  const templateStyles: Record<Template['category'] | 'other', { icon: typeof FileText; bg: string; iconColor: string }> = {
    wrap: { icon: FileText, bg: 'bg-primary/10', iconColor: 'text-primary' },
    'focus-area': { icon: Target, bg: 'bg-bucket-deep/10', iconColor: 'text-bucket-deep' },
    tool: { icon: Wrench, bg: 'bg-muted', iconColor: 'text-foreground' },
    other: { icon: Sparkles, bg: 'bg-accent/10', iconColor: 'text-accent' },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-subtle opacity-60" />
        <div className="container max-w-4xl relative text-center">
          <h1 className="font-display text-4xl md:text-5xl font-medium mb-4 tracking-tight">Templates & Tools</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready-to-use structures for your career conversations.
          </p>
        </div>
      </section>

      {/* Templates */}
      <section className="py-8 px-4 pb-32">
        <div className="container max-w-4xl space-y-16">
          {loading && templates.length === 0 && (
            <div className="text-muted-foreground text-center py-12">Loading templates...</div>
          )}

          {!loading && templates.length === 0 && (
            <div className="text-muted-foreground text-center py-12">No templates available.</div>
          )}

          {templates.map(template => {
            const style = templateStyles[template.category] || templateStyles.other;
            const Icon = style.icon;

            return (
              <article key={template.id} className="relative group">
                {/* Visual Anchor for the Template */}
                <div className="absolute -left-3 md:-left-12 top-8 md:top-6 flex flex-col items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center shadow-sm`}>
                    <Icon className={`h-4 w-4 ${style.iconColor}`} />
                  </div>
                  {template.locked && <Lock className="h-3 w-3 text-muted-foreground/60" />}
                </div>

                <Card className="shadow-card border-none bg-card/50 backdrop-blur-sm overflow-hidden ring-1 ring-border/50">
                  <CardContent className="p-6 md:p-10">
                    <AestheticTemplateView content={template.content} />
                  </CardContent>
                </Card>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
