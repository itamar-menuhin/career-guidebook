import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  PlayCircle, 
  Map, 
  Target, 
  LayoutGrid, 
  FileText,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '@/contexts/ContentContext';

const navItems = [
  { path: '/', label: 'Start Here', icon: BookOpen },
  { path: '/flow', label: 'Flow', icon: PlayCircle },
  { path: '/pathways', label: 'Pathways', icon: Map },
  { path: '/focus-areas', label: 'Focus Areas', icon: Target },
  { path: '/cards', label: 'Cards', icon: LayoutGrid },
  { path: '/templates', label: 'Templates & Tools', icon: FileText },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { flowSteps } = useContent();

  const handleFlowStepClick = (stepId: string) => {
    navigate(`/flow#${stepId}`);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-background">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">
              Career Guidebook
            </span>
          </Link>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                location.pathname === item.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Flow Steps Quick Jump */}
        {flowSteps.length > 0 && (
          <div className="px-4 pt-2 pb-4 border-t mt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Jump to Flow Step
            </p>
            <div className="space-y-1">
              {flowSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleFlowStepClick(step.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{step.shortTitle}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
