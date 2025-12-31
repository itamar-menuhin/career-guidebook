import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "@/contexts/SessionContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { TopNav } from "@/components/TopNav";
import { CommandPalette } from "@/components/CommandPalette";
import { MobileNav } from "@/components/MobileNav";
import StartHere from "@/pages/StartHere";
import SessionPage from "@/pages/SessionPage";
import PathwaysPage from "@/pages/PathwaysPage";
import FocusAreasPage from "@/pages/FocusAreasPage";
import FocusAreaDetail from "@/pages/FocusAreaDetail";
import CardsPage from "@/pages/CardsPage";
import TemplatesPage from "@/pages/TemplatesPage";
import SharedSessionPage from "@/pages/SharedSessionPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <SearchProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <TopNav />
              <CommandPalette />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<StartHere />} />
                  <Route path="/session" element={<SessionPage />} />
                  <Route path="/pathways" element={<PathwaysPage />} />
                  <Route path="/focus-areas" element={<FocusAreasPage />} />
                  <Route path="/focus-areas/:id" element={<FocusAreaDetail />} />
                  <Route path="/cards" element={<CardsPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/s/:slug" element={<SharedSessionPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </SearchProvider>
    </SessionProvider>
  </QueryClientProvider>
);

export default App;
