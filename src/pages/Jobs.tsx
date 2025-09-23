import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, Clock, DollarSign, Building, Filter, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Job {
  id: string;
  title: string;
  department: string;
  level: string;
  employment_type: string;
  location: string;
  is_remote: boolean;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  description: string;
  requirements: string[];
  benefits: string[];
  status: string;
  created_at: string;
  companies: {
    name: string;
    industry?: string;
    size_range?: string;
    logo_url?: string;
  } | null;
}

export default function Jobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      let query = supabase
        .from("job_positions")
        .select(`
          *,
          companies (
            name,
            industry,
            size_range,
            logo_url
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }
      if (locationFilter) {
        query = query.ilike("location", `%${locationFilter}%`);
      }
      if (levelFilter) {
        query = query.eq("level", levelFilter);
      }
      if (typeFilter) {
        query = query.eq("employment_type", typeFilter);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar vagas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setLevelFilter("");
    setTypeFilter("");
    fetchJobs();
  };

  const getLevelText = (level: string) => {
    const levels = {
      entry: "Iniciante",
      junior: "Júnior",
      mid: "Pleno",
      senior: "Sênior",
      lead: "Lead",
      manager: "Gerente",
      director: "Diretor",
      vp: "VP",
      "c-level": "C-Level",
    };
    return levels[level as keyof typeof levels] || level;
  };

  const getTypeText = (type: string) => {
    const types = {
      "full-time": "Tempo Integral",
      "part-time": "Meio Período",
      contract: "Contrato",
      internship: "Estágio",
      freelance: "Freelance",
    };
    return types[type as keyof typeof types] || type;
  };

  const formatSalary = (min?: number, max?: number, currency: string = "BRL") => {
    if (!min && !max) return "Salário não informado";
    
    const formatter = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    });

    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    if (min) {
      return `A partir de ${formatter.format(min)}`;
    }
    if (max) {
      return `Até ${formatter.format(max)}`;
    }
    return "Salário não informado";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-6 bg-muted rounded w-2/3"></div>
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                    </div>
                    <div className="w-16 h-16 bg-muted rounded"></div>
                  </div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                    <div className="h-6 bg-muted rounded w-24"></div>
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
          <h1 className="text-3xl font-bold text-foreground">Oportunidades</h1>
          <p className="text-muted-foreground">
            Encontre as melhores vagas para acelerar sua carreira
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cargo ou empresa</label>
                <Input
                  placeholder="Ex: Desenvolvedor, Google..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Localização</label>
                <Input
                  placeholder="Ex: São Paulo, Remoto..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nível</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os níveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os níveis</SelectItem>
                    <SelectItem value="entry">Iniciante</SelectItem>
                    <SelectItem value="junior">Júnior</SelectItem>
                    <SelectItem value="mid">Pleno</SelectItem>
                    <SelectItem value="senior">Sênior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="full-time">Tempo Integral</SelectItem>
                    <SelectItem value="part-time">Meio Período</SelectItem>
                    <SelectItem value="contract">Contrato</SelectItem>
                    <SelectItem value="internship">Estágio</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={fetchJobs}>
                <Search className="w-4 h-4 mr-2" />
                Buscar Vagas
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma vaga encontrada</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros de busca para encontrar mais oportunidades.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  {jobs.length} oportunidade{jobs.length !== 1 ? 's' : ''} encontrada{jobs.length !== 1 ? 's' : ''}
                </p>
              </div>

              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          {job.companies?.logo_url ? (
                            <img 
                              src={job.companies.logo_url} 
                              alt={`${job.companies.name} logo`}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                              <Building className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-1">
                              {job.title}
                            </h3>
                            <p className="text-lg text-primary font-medium mb-2">
                              {job.companies?.name || 'Empresa não informada'}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {job.location}
                                {job.is_remote && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Remoto
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {formatDistanceToNow(new Date(job.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                {formatSalary(job.salary_min, job.salary_max, job.currency)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-foreground line-clamp-3">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline">{getLevelText(job.level)}</Badge>
                      <Badge variant="outline">{getTypeText(job.employment_type)}</Badge>
                      {job.department && (
                        <Badge variant="outline">{job.department}</Badge>
                      )}
                      {job.companies?.industry && (
                        <Badge variant="secondary">{job.companies.industry}</Badge>
                      )}
                    </div>

                    {job.requirements && job.requirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-foreground mb-2">Requisitos:</h4>
                        <div className="flex flex-wrap gap-1">
                          {job.requirements.slice(0, 5).map((req, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                          {job.requirements.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{job.requirements.length - 5} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-muted-foreground">
                        {job.companies?.size_range && (
                          <span>{job.companies.size_range} funcionários</span>
                        )}
                      </div>
                      <Button>
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}