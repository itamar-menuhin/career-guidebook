import { focusAreas } from '@/data/focusAreas';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Target } from 'lucide-react';

export default function FocusAreasPage() {
  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Focus Areas</h1>
        <p className="text-lg text-muted-foreground">Deep-dive pages for specific career paths with curated resources and guidance.</p>
      </div>
      <div className="grid gap-4">
        {focusAreas.map(area => (
          <Link key={area.id} to={`/focus-areas/${area.id}`} className="group">
            <Card className="shadow-soft hover:shadow-card transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center shrink-0">
                  <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl mb-1">{area.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{area.overview}</CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{area.curatedCardIds.length} cards</Badge>
                    <Badge variant="outline">{area.roleShapes.length} role shapes</Badge>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
