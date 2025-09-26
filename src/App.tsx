import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavigationProvider } from "@/hooks/useNavigation";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import ProfessionalGoals from "./pages/ProfessionalGoals";
import Home from "./pages/Home";
import Homepage from "./pages/Homepage";
import Feed from "./pages/Feed";
import Connections from "./pages/Connections";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <NavigationProvider>
          <Routes>
            {/* Root route - handled by NavigationProvider */}
            <Route path="/" element={<div />} />
            
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<ProfessionalGoals />} />
            
            {/* Protected routes with layout */}
            <Route
              path="/homepage"
              element={
                <AppLayout>
                  <Homepage />
                </AppLayout>
              }
            />
            <Route
              path="/home"
              element={
                <AppLayout>
                  <Home />
                </AppLayout>
              }
            />
            <Route
              path="/feed"
              element={
                <AppLayout>
                  <Feed />
                </AppLayout>
              }
            />
            <Route
              path="/connections"
              element={
                <AppLayout>
                  <Connections />
                </AppLayout>
              }
            />
            <Route
              path="/jobs"
              element={
                <AppLayout>
                  <Jobs />
                </AppLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <AppLayout>
                  <Profile />
                </AppLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Configurações - Em breve</h1>
                  </div>
                </AppLayout>
              }
            />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </NavigationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
