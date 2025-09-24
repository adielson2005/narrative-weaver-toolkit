import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, UserPlus, Check, X, Clock } from "lucide-react";

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  industry?: string;
  skills?: string[];
}

interface Connection {
  id: string;
  status: string;
  message?: string;
  created_at: string;
  requester_id: string;
  receiver_id: string;
  connected_at?: string;
  receiver_profile?: Profile;
  requester_profile?: Profile;
}

export default function Connections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchPendingRequests();
      fetchSentRequests();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("connections")
        .select(`
          *,
          receiver_profile:profiles!connections_receiver_id_fkey (
            user_id,
            full_name,
            email,
            avatar_url,
            industry,
            skills
          )
        `)
        .eq("requester_id", user.id)
        .eq("status", "accepted");

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar conexões",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchPendingRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("connections")
        .select(`
          *,
          requester_profile:profiles!connections_requester_id_fkey (
            user_id,
            full_name,
            email,
            avatar_url,
            industry,
            skills
          )
        `)
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar solicitações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("connections")
        .select(`
          *,
          receiver_profile:profiles!connections_receiver_id_fkey (
            user_id,
            full_name,
            email,
            avatar_url,
            industry,
            skills
          )
        `)
        .eq("requester_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      setSentRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar solicitações enviadas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const searchProfiles = async () => {
    if (!searchQuery.trim()) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("full_name", `%${searchQuery}%`)
        .neq("user_id", user?.id)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("connections")
        .insert({
          requester_id: user.id,
          receiver_id: receiverId,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de conexão foi enviada com sucesso.",
      });

      // Remove from search results
      setSearchResults(searchResults.filter(profile => profile.user_id !== receiverId));
      fetchSentRequests();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const respondToRequest = async (connectionId: string, status: "accepted" | "declined") => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({ 
          status,
          connected_at: status === "accepted" ? new Date().toISOString() : null
        })
        .eq("id", connectionId);

      if (error) throw error;

      toast({
        title: status === "accepted" ? "Conexão aceita!" : "Solicitação recusada",
        description: status === "accepted" 
          ? "Você agora está conectado com este profissional."
          : "A solicitação foi recusada.",
      });

      fetchPendingRequests();
      if (status === "accepted") {
        fetchConnections();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao responder solicitação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/6"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conexões</h1>
          <p className="text-muted-foreground">
            Gerencie sua rede profissional e faça novas conexões
          </p>
        </div>

        <Tabs defaultValue="connections" className="w-full">
          <TabsList>
            <TabsTrigger value="connections">
              Minhas Conexões ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Solicitações ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Enviadas ({sentRequests.length})
            </TabsTrigger>
            <TabsTrigger value="search">Buscar Pessoas</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4">
            {connections.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma conexão ainda</h3>
                  <p className="text-muted-foreground">
                    Comece a fazer conexões para expandir sua rede profissional!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.map((connection) => (
                  <Card key={connection.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={connection.receiver_profile?.avatar_url} />
                          <AvatarFallback>
                            {connection.receiver_profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {connection.receiver_profile?.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {connection.receiver_profile?.industry || 'Profissional'}
                          </p>
                        </div>
                      </div>
                      {connection.receiver_profile?.skills && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {connection.receiver_profile.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação pendente</h3>
                  <p className="text-muted-foreground">
                    Você não tem solicitações de conexão no momento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.requester_profile?.avatar_url} />
                            <AvatarFallback>
                              {request.requester_profile?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {request.requester_profile?.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.requester_profile?.industry || 'Profissional'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => respondToRequest(request.id, "accepted")}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respondToRequest(request.id, "declined")}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Recusar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação enviada</h3>
                  <p className="text-muted-foreground">
                    Você não enviou solicitações de conexão recentemente.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.receiver_profile?.avatar_url} />
                            <AvatarFallback>
                              {request.receiver_profile?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {request.receiver_profile?.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.receiver_profile?.industry || 'Profissional'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">Pendente</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buscar Profissionais</CardTitle>
                <CardDescription>
                  Encontre profissionais e expanda sua rede
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Digite o nome do profissional..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchProfiles()}
                  />
                  <Button onClick={searchProfiles}>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((profile) => (
                  <Card key={profile.user_id}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback>
                            {profile.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {profile.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {profile.industry || 'Profissional'}
                          </p>
                        </div>
                      </div>
                      {profile.skills && (
                        <div className="mb-4 flex flex-wrap gap-1">
                          {profile.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => sendConnectionRequest(profile.user_id)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Conectar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}