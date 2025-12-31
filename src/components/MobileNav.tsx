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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Start Here', icon: BookOpen },
  { path: '/session', label: 'Run a Session', icon: PlayCircle },
  { path: '/pathways', label: 'Common Pathways', icon: Map },
  { path: '/focus-areas', label: 'Focus Areas', icon: Target },
  { path: '/cards', label: 'Recommendation Cards', icon: LayoutGrid },
  { path: '/templates', label: 'Templates & Tools', icon: FileText },
];

export function MobileNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
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
      </SheetContent>
    </Sheet>
  );
}
