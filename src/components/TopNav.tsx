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
} from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { FlowJumpDropdown } from '@/components/FlowJumpDropdown';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/contexts/SearchContext';

const navItems = [
  { path: '/', label: 'Start Here', icon: BookOpen },
  { path: '/flow', label: 'Session Flow', icon: PlayCircle },
  { path: '/pathways', label: 'Pathways', icon: Map },
  { path: '/focus-areas', label: 'Focus Areas', icon: Target },
  { path: '/cards', label: 'Cards', icon: LayoutGrid },
  { path: '/templates', label: 'Templates', icon: FileText },
];

export function TopNav() {
  const location = useLocation();
  const { openSearch } = useSearch();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-5">
          <MobileNav />
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl gradient-hero flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow duration-300">
              <BookOpen className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-display font-medium text-lg hidden sm:inline-block tracking-tight">
              Career Guidebook
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 ml-2">
            {navItems.map(item => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Flow Jump Dropdown */}
          <FlowJumpDropdown />
          
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground border-border/50 hover:border-border hover:bg-muted/50 h-9 px-3"
            onClick={openSearch}
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline text-sm">Search...</span>
            <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-1">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden h-9 w-9"
            onClick={openSearch}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
