import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 h-16 flex items-center backdrop-blur-sm bg-background/80 border-b border-border/50 px-6 transition-all">
            <SidebarTrigger className="mr-4 hover:bg-accent rounded-lg transition-colors" />
            <div className="flex-1" />
            {/* Future: Search, notifications, user menu */}
          </header>
          
          <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-accent/5">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      <Toaster />
      <Sonner />
    </SidebarProvider>
  );
}