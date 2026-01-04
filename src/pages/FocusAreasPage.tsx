import { useContent } from '@/contexts/ContentContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Target } from 'lucide-react';

export default function FocusAreasPage() {
  const { focusAreas, loading } = useContent();

  if (loading && focusAreas.length === 0) {
    return (
      <div className="container max-w-4xl py-12">
        <p className="text-muted-foreground">Loading focus areas...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Focus Areas</h1>
        <p className="text-lg text-muted-foreground">Deep-dive pages for specific career paths with curated resources and guidance.</p>
      </div>
      {focusAreas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-muted-foreground">
          No focus areas available yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {focusAreas.map(area => (
            <Link key={area.id} to={`/focus-areas/${area.id}`} className="group">
              <Card className="shadow-soft hover:shadow-card transition-all">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center shrink-0">
                    <Target className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-2xl mb-2 font-display">{area.name}</CardTitle>
                    <div className="text-lg text-muted-foreground leading-snug line-clamp-2 mb-3">
                      {area.overviewExcerpt || area.overviewPlainText}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-sm font-normal py-1 px-3">{area.curatedCardIds.length} cards</Badge>
                      <Badge variant="outline" className="text-sm font-normal py-1 px-3">{area.roleShapes.length} role shapes</Badge>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors shrink-0 self-center ml-4" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
