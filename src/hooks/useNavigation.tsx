import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

interface NavigationContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoggedIn: boolean;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  user: null,
  session: null,
  loading: true,
  isLoggedIn: false,
  onboardingCompleted: false,
  setOnboardingCompleted: () => {},
});

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider = ({ children }: NavigationProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboardingCompleted, setOnboardingCompletedState] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Load states from localStorage
  useEffect(() => {
    const savedLoginState = localStorage.getItem("isLoggedIn") === "true";
    const savedOnboardingState = localStorage.getItem("onboardingCompleted") === "true";
    
    setIsLoggedIn(savedLoginState);
    setOnboardingCompletedState(savedOnboardingState);
  }, []);

  const setOnboardingCompleted = (completed: boolean) => {
    localStorage.setItem("onboardingCompleted", completed.toString());
    setOnboardingCompletedState(completed);
  };

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        const loggedIn = !!session?.user;
        setIsLoggedIn(loggedIn);
        localStorage.setItem("isLoggedIn", loggedIn.toString());
        
        // Clear onboarding state if user logs out
        if (!loggedIn) {
          localStorage.setItem("onboardingCompleted", "false");
          setOnboardingCompletedState(false);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);
      localStorage.setItem("isLoggedIn", loggedIn.toString());
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Navigation logic
  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;
    
    // Root path redirection logic
    if (currentPath === "/") {
      if (!isLoggedIn) {
        navigate("/auth", { replace: true });
      } else if (!onboardingCompleted) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
      return;
    }

    // Redirect logged in users away from auth page
    if (currentPath === "/auth" && isLoggedIn) {
      if (!onboardingCompleted) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
      return;
    }

    // Redirect users to auth if trying to access protected routes without login
    if (currentPath.startsWith("/home") || 
        currentPath.startsWith("/feed") || 
        currentPath.startsWith("/connections") ||
        currentPath.startsWith("/jobs") ||
        currentPath.startsWith("/profile") ||
        currentPath.startsWith("/settings")) {
      if (!isLoggedIn) {
        navigate("/auth", { replace: true });
        return;
      }
      if (!onboardingCompleted) {
        navigate("/onboarding", { replace: true });
        return;
      }
    }

    // Redirect to home if trying to access onboarding after completion
    if (currentPath === "/onboarding" && isLoggedIn && onboardingCompleted) {
      navigate("/home", { replace: true });
    }

  }, [loading, isLoggedIn, onboardingCompleted, location.pathname, navigate]);

  const value = {
    user,
    session,
    loading,
    isLoggedIn,
    onboardingCompleted,
    setOnboardingCompleted,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};