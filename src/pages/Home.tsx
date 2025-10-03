import { useNavigation } from "@/hooks/useNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, MessageSquare, TrendingUp, Award, Calendar, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserStats {
  posts_count: number;
  connections_count: number;
  likes_received: number;
  profile_views: number;
}

export default function Home() {
  const { user } = useNavigation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_stats', { user_uuid: user?.id });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayStats = [
    { 
      icon: Users, 
      label: "Conexões", 
      value: stats?.connections_count?.toString() || "0", 
      color: "text-blue-600" 
    },
    { 
      icon: MessageSquare, 
      label: "Posts", 
      value: stats?.posts_count?.toString() || "0", 
      color: "text-purple-600" 
    },
    { 
      icon: TrendingUp, 
      label: "Curtidas", 
      value: stats?.likes_received?.toString() || "0", 
      color: "text-orange-600" 
    },
    { 
      icon: Award, 
      label: "Visualizações", 
      value: stats?.profile_views?.toString() || "0", 
      color: "text-green-600" 
    },
  ];

  const quickActions = [
    {
      title: "Ver Meu Feed",
      description: "Acompanhe as últimas atualizações da sua rede",
      icon: MessageSquare,
      href: "/feed",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      title: "Explorar Vagas",
      description: "Encontre oportunidades perfeitas para sua carreira",
      icon: Briefcase,
      href: "/jobs",
      color: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    },
    {
      title: "Minhas Conexões",
      description: "Gerencie sua rede profissional",
      icon: Users,
      href: "/connections",
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    },
  ];

  const recentActivity = [
    {
      type: "connection",
      message: "Nova conexão: Maria Silva aceitou sua solicitação",
      time: "2 horas atrás",
      icon: Users,
    },
    {
      type: "job",
      message: "Nova vaga compatível: Desenvolvedor Senior em TechCorp",
      time: "4 horas atrás",
      icon: Briefcase,
    },
    {
      type: "achievement",
      message: "Parabéns! Você completou seu perfil",
      time: "1 dia atrás",
      icon: Award,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-lg p-8 border border-primary/20">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Bem-vindo de volta! 👋
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Aqui está o que está acontecendo na sua rede profissional hoje.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/feed')}
            className="bg-primary hover:bg-primary/90"
          >
            Ir para o Feed
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {loading ? "..." : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse rapidamente as principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.href} className="block">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Suas últimas atualizações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <activity.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Complete seu perfil</h3>
              <p className="opacity-90">
                Um perfil completo recebe 5x mais visualizações. Complete as informações restantes.
              </p>
            </div>
            <Button variant="secondary" asChild>
              <Link to="/profile">
                Completar Perfil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}