import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import ProfessionalGoals from "./pages/ProfessionalGoals";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Connections from "./pages/Connections";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<ProfessionalGoals />} />
            
            {/* Protected routes with layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/feed" element={<Feed />} />
                      <Route path="/connections" element={<Connections />} />
                      <Route path="/jobs" element={<Jobs />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Configurações - Em breve</h1></div>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
