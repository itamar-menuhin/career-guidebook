import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Lock } from 'lucide-react';

export default function TemplatesPage() {
  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Templates & Tools</h1>
        <p className="text-lg text-muted-foreground">Reference templates for structuring sessions and notes.</p>
      </div>
      <div className="grid gap-4">
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><Lock className="h-4 w-4 text-muted-foreground" /></div>
            <CardTitle>Wrap Summary Template</CardTitle>
            <CardDescription>Standard format for session wrap-up notes exported to the coachee.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`## Snapshot
- **Current situation:** [...]
- **Aiming for:** [...]
- **Must-haves:** [...]
- **Constraints:** [...]

## Promising Directions
### 1. [Direction Title]
- **Why promising:** [...]
- **First small steps (≤60 min):** [...]
- **Links:** [...]
- **People to talk to:** [...]

## Closing
- **Next steps:** [...]
- **Follow-up plan:** [...]`}
            </pre>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-bucket-deep" /><Lock className="h-4 w-4 text-muted-foreground" /></div>
            <CardTitle>Focus Area Template</CardTitle>
            <CardDescription>Structure for adding new focus areas to the guidebook.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`{
  id: "unique-id",
  name: "Focus Area Name",
  overview: "What this area is trying to achieve...",
  roleShapes: ["Role 1", "Role 2"],
  fitSignals: ["Signal 1", "Signal 2"],
  buckets: {
    quickTaste: { title: "...", cardIds: [...] },
    deeperDive: { ... },
    handsOn: { ... },
    jobBoard: { ... }
  },
  curatedCardIds: [...],
  peopleToTalkToPrompts: [...]
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
