import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  PlayCircle, 
  Map, 
  Target, 
  LayoutGrid, 
  FileText,
  Search,
  Command,
  Menu
} from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/contexts/SearchContext';

const navItems = [
  { path: '/', label: 'Start Here', icon: BookOpen },
  { path: '/session', label: 'Run a Session', icon: PlayCircle },
  { path: '/pathways', label: 'Common Pathways', icon: Map },
  { path: '/focus-areas', label: 'Focus Areas', icon: Target },
  { path: '/cards', label: 'Recommendation Cards', icon: LayoutGrid },
  { path: '/templates', label: 'Templates & Tools', icon: FileText },
];

export function TopNav() {
  const location = useLocation();
  const { openSearch } = useSearch();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <MobileNav />
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg hidden sm:inline-block">
              Career Guidebook
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-muted-foreground"
            onClick={openSearch}
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={openSearch}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
