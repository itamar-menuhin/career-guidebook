import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, Target, Map, LayoutGrid, BookOpen, Users, Lightbulb, ArrowRight } from 'lucide-react';

export default function StartHere() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container max-w-4xl relative">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
            1:1 Career Counseling Guidebook
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            A practical toolkit for running impactful career conversations. Structured flows, curated recommendations, and session notes — all in one place.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="gradient-hero text-primary-foreground hover:opacity-90">
              <Link to="/session"><PlayCircle className="h-5 w-5 mr-2" />Run a Session</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/focus-areas"><Target className="h-5 w-5 mr-2" />Browse Focus Areas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What Good Looks Like */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-4xl">
          <h2 className="font-display text-2xl font-semibold mb-6">What Good Looks Like</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-soft">
              <CardHeader><Users className="h-8 w-8 text-primary mb-2" /><CardTitle className="text-lg">Mutual Think Tank</CardTitle></CardHeader>
              <CardContent><CardDescription>You're collaborators, not advisor and advisee. Explore together with genuine curiosity.</CardDescription></CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader><Lightbulb className="h-8 w-8 text-accent mb-2" /><CardTitle className="text-lg">Concrete Next Steps</CardTitle></CardHeader>
              <CardContent><CardDescription>Every session ends with 2-3 specific, actionable steps the person can take in the next week.</CardDescription></CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader><BookOpen className="h-8 w-8 text-bucket-deep mb-2" /><CardTitle className="text-lg">Tailored Resources</CardTitle></CardHeader>
              <CardContent><CardDescription>Match recommendations to the person's situation, not a generic list.</CardDescription></CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl">
          <h2 className="font-display text-2xl font-semibold mb-6">Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { to: '/session', icon: PlayCircle, title: 'Run a Session', desc: 'Guided 60-90 min session flow with notes' },
              { to: '/pathways', icon: Map, title: 'Common Pathways', desc: 'Focus-area-agnostic starting points' },
              { to: '/focus-areas', icon: Target, title: 'Focus Areas', desc: 'Deep dives into specific career paths' },
              { to: '/cards', icon: LayoutGrid, title: 'Recommendation Cards', desc: 'Filterable catalog of resources' },
            ].map(item => (
              <Link key={item.to} to={item.to} className="group">
                <Card className="shadow-soft hover:shadow-card transition-shadow h-full">
                  <CardContent className="p-4 flex items-center gap-4">
                    <item.icon className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1"><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.desc}</p></div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
