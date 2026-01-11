import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, Target, Map, LayoutGrid, BookOpen, Users, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';

export default function StartHere() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-glow" />
        <div className="absolute inset-0 pattern-dots opacity-50" />

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="container max-w-4xl relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-up">
            <Sparkles className="h-4 w-4" />
            <span>Helping others do the most good</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-6 animate-fade-up stagger-1">
            <span className="text-gradient">High-Impact Career Advising</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed animate-fade-up stagger-2">
            A toolkit for guiding talent toward the world's most pressing problems. Navigate uncertainty, identify high-leverage paths, and help others maximize their counterfactual impact.
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-up stagger-3">
            <Button asChild size="lg" className="btn-glow gradient-hero text-primary-foreground shadow-glow hover:shadow-elevated transition-all duration-300 h-12 px-6">
              <Link to="/flow">
                <PlayCircle className="h-5 w-5 mr-2" />
                Session Guide
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="hover-lift h-12 px-6 border-border/60">
              <Link to="/focus-areas">
                <Target className="h-5 w-5 mr-2" />
                Browse Focus Areas
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What Good Looks Like */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 gradient-subtle" />
        <div className="container max-w-5xl relative">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">A Partnership for Impact</h2>
            <p className="text-muted-foreground">How we show up matters as much as what we know</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                iconColor: 'text-primary',
                bgColor: 'bg-primary/10',
                title: 'Side-by-Side Discovery',
                description: "We don't have all the answers. We facilitate a process of discovery with the candidate.",
              },
              {
                icon: Lightbulb,
                iconColor: 'text-accent',
                bgColor: 'bg-accent/10',
                title: 'Clear Outcomes',
                description: 'They leave with clarity on 3–6 directions, a sense of energy, and concrete low-cost experiments.',
              },
              {
                icon: BookOpen,
                iconColor: 'text-bucket-deep',
                bgColor: 'bg-bucket-deep/10',
                title: 'Personalized Context',
                description: "Every career is unique. Tailor evidence-based advice to their specific constraints and profile.",
              },
            ].map((item, index) => (
              <Card
                key={item.title}
                className={`card-shine shadow-soft hover:shadow-card transition-all duration-300 border-border/50 animate-fade-up stagger-${index + 1}`}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center mb-3`}>
                    <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg font-display">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[15px] leading-relaxed">{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">Advisor Toolkit</h2>
            <p className="text-muted-foreground">Everything you need to build a high-impact plan</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                to: '/flow',
                icon: PlayCircle,
                title: 'Session Guide',
                desc: 'Step-by-step flow for the 1:1',
                accent: 'group-hover:bg-primary/10 group-hover:text-primary',
              },
              {
                to: '/pathways',
                icon: Map,
                title: 'Common Approaches',
                desc: "Archetypes like 'Career Change' or 'Skill Building'",
                accent: 'group-hover:bg-bucket-hands/10 group-hover:text-bucket-hands',
              },
              {
                to: '/focus-areas',
                icon: Target,
                title: 'Problem Profiles',
                desc: 'Deep dives into top cause areas (AI, Bio, etc)',
                accent: 'group-hover:bg-bucket-deep/10 group-hover:text-bucket-deep',
              },
              {
                to: '/cards',
                icon: LayoutGrid,
                title: 'Resource Database',
                desc: 'Library of high-value opportunities',
                accent: 'group-hover:bg-bucket-jobs/10 group-hover:text-bucket-jobs',
              },
            ].map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                className={`group animate-fade-up stagger-${index + 1}`}
              >
                <Card className="hover-lift shadow-soft h-full border-border/50 overflow-hidden">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 transition-colors duration-300 ${item.accent}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium font-display text-lg">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer hint */}
      <section className="py-12 px-4">
        <div className="container max-w-4xl">
          <div className="section-divider mb-12" />
          <p className="text-center text-sm text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">⌘K</kbd> to search anything
          </p>
        </div>
      </section>
    </div>
  );
}
