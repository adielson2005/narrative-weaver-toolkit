import { useNavigation } from "@/hooks/useNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Briefcase, MessageSquare, TrendingUp, Award, Calendar, ArrowRight, Star, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserStats {
  posts_count: number;
  connections_count: number;
  likes_received: number;
  profile_views: number;
}

interface Profile {
  full_name: string;
  job_title?: string;
  industry?: string;
  avatar_url?: string;
  skills?: string[];
  objectives?: string[];
}

export default function Homepage() {
  const { user } = useNavigation();
  const [stats, setStats] = useState<UserStats>({ posts_count: 0, connections_count: 0, likes_received: 0, profile_views: 0 });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentActivity, setRecentActivity] = useState([
    {
      type: "connection",
      message: "Nova conexão: Maria Silva aceitou sua solicitação",
      time: "2 horas atrás",
      icon: Users,
    },
    {
      type: "job",
      message: "3 novas vagas compatíveis com seu perfil",
      time: "4 horas atrás",
      icon: Briefcase,
    },
    {
      type: "achievement",
      message: "Seu perfil recebeu 15 visualizações hoje!",
      time: "6 horas atrás",
      icon: TrendingUp,
    },
  ]);

  useEffect(() => {
    if (user?.id) {
      fetchUserStats();
      fetchProfile();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user?.id) return;
    
    try {
      // Get post count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      // Get connections count
      const { count: connectionsCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');

      // Get likes received count
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('posts!inner(*)', { count: 'exact', head: true })
        .eq('posts.author_id', user.id);

      setStats({
        posts_count: postsCount || 0,
        connections_count: connectionsCount || 0,
        likes_received: likesCount || 0,
        profile_views: 100 // Placeholder
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, job_title, industry, avatar_url, skills, objectives')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const quickActions = [
    {
      title: "Explorar Feed",
      description: "Veja as últimas novidades da sua rede",
      icon: MessageSquare,
      href: "/feed",
      color: "bg-primary/10 text-primary",
      gradient: "from-primary/20 to-primary/5",
    },
    {
      title: "Buscar Vagas",
      description: "Encontre oportunidades incríveis",
      icon: Briefcase,
      href: "/jobs",
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
      gradient: "from-green-500/20 to-green-500/5",
    },
    {
      title: "Conectar-se",
      description: "Expanda sua rede profissional",
      icon: Users,
      href: "/connections",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      gradient: "from-purple-500/20 to-purple-500/5",
    },
  ];

  const statsCards = [
    { 
      icon: MessageSquare, 
      label: "Posts Publicados", 
      value: stats.posts_count.toString(),
      change: "+12%",
      color: "text-blue-600 dark:text-blue-400" 
    },
    { 
      icon: Users, 
      label: "Conexões", 
      value: stats.connections_count.toString(),
      change: "+5%",
      color: "text-green-600 dark:text-green-400" 
    },
    { 
      icon: TrendingUp, 
      label: "Curtidas Recebidas", 
      value: stats.likes_received.toString(),
      change: "+23%",
      color: "text-purple-600 dark:text-purple-400" 
    },
    { 
      icon: Star, 
      label: "Visualizações", 
      value: stats.profile_views.toString(),
      change: "+8%",
      color: "text-orange-600 dark:text-orange-400" 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/80 p-8 text-primary-foreground">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-16 w-16 border-2 border-primary-foreground/20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-lg">
                    {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">
                    Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}! 👋
                  </h1>
                  <p className="text-primary-foreground/80 text-lg">
                    {profile?.job_title || 'Profissional'} • {profile?.industry || 'Sua indústria'}
                  </p>
                </div>
              </div>
              <p className="text-primary-foreground/90 max-w-2xl">
                Bem-vindo ao seu hub profissional! Explore oportunidades, conecte-se com profissionais e impulsione sua carreira.
              </p>
            </div>
            <Button asChild variant="secondary" size="lg" className="whitespace-nowrap">
              <Link to="/feed" className="flex items-center space-x-2">
                <span>Ver Feed</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-0">
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <CardTitle className="text-xl">Ações Rápidas</CardTitle>
                </div>
                <CardDescription>
                  Acesse rapidamente as principais funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={index} to={action.href} className="block group">
                    <div className={`p-6 rounded-xl bg-gradient-to-br ${action.gradient} border border-border/50 hover:shadow-lg transition-all duration-300 hover:scale-105`}>
                      <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Atividades Recentes</CardTitle>
              </div>
              <CardDescription>Suas últimas atualizações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <activity.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground leading-relaxed">{activity.message}</p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Skills & Objectives */}
        {profile && (profile.skills || profile.objectives) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {profile.skills && profile.skills.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center space-x-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span>Suas Habilidades</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(0, 8).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                    {profile.skills.length > 8 && (
                      <Badge variant="outline" className="px-3 py-1">
                        +{profile.skills.length - 8} mais
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.objectives && profile.objectives.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center space-x-2">
                    <Award className="w-5 h-5 text-primary" />
                    <span>Seus Objetivos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profile.objectives.slice(0, 3).map((objective, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>{objective}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* CTA Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-accent/20 via-primary/10 to-secondary/20">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Pronto para o próximo passo?</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore o feed para ver as últimas novidades da sua rede, descubra novas oportunidades de trabalho e conecte-se com profissionais da sua área.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg">
                  <Link to="/feed" className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Explorar Feed</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/jobs" className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Ver Vagas</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}