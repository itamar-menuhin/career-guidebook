import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SearchProvider } from "@/contexts/SearchContext";
import { ContentProvider, useContent } from "@/contexts/ContentContext";
import { TopNav } from "@/components/TopNav";
import { CommandPalette } from "@/components/CommandPalette";
import { MobileNav } from "@/components/MobileNav";
import StartHere from "@/pages/StartHere";
import FlowPage from "@/pages/FlowPage";
import PathwaysPage from "@/pages/PathwaysPage";
import FocusAreasPage from "@/pages/FocusAreasPage";
import FocusAreaDetail from "@/pages/FocusAreaDetail";
import CardsPage from "@/pages/CardsPage";
import TemplatesPage from "@/pages/TemplatesPage";
import NotFound from "@/pages/NotFound";
import { ContentError } from "@/pages/ContentError";
import { useScrollToHash } from "@/hooks/useScrollToHash";

const queryClient = new QueryClient();

const ScrollToHashHandler = () => {
  const location = useLocation();
  
  // Disable global scroll-to-hash for pages that manage their own scrolling
  const hasCustomScrolling = ['/flow', '/focus-areas/', '/pathways'].some(
    path => location.pathname.startsWith(path)
  );
  
  // Only use the hook if the page doesn't have custom scrolling
  if (!hasCustomScrolling) {
    useScrollToHash();
  }
  
  return null;
};

const AppShell = () => {
  const { error, refresh } = useContent();

  if (error) {
    return <ContentError onRetry={refresh} message={error.message} />;
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <TopNav />
          <CommandPalette />
          <ScrollToHashHandler />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<StartHere />} />
              <Route path="/flow" element={<FlowPage />} />
              <Route path="/pathways" element={<PathwaysPage />} />
              <Route path="/focus-areas" element={<FocusAreasPage />} />
              <Route path="/focus-areas/:id" element={<FocusAreaDetail />} />
              <Route path="/cards" element={<CardsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ContentProvider>
      <SearchProvider>
        <AppShell />
      </SearchProvider>
    </ContentProvider>
  </QueryClientProvider>
);

export default App;
