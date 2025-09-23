import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  MapPin, 
  Mail, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Plus, 
  Edit, 
  Save,
  X
} from "lucide-react";

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  industry?: string;
  skills?: string[];
  objectives?: string[];
}

interface WorkExperience {
  id?: string;
  company_name: string;
  position_title: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  achievements?: string[];
}

interface Education {
  id?: string;
  institution_name: string;
  degree_type: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  grade?: string;
  description?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  // Form states
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [newWorkExp, setNewWorkExp] = useState<WorkExperience>({
    company_name: "",
    position_title: "",
    start_date: "",
    end_date: "",
    is_current: false,
    description: "",
    achievements: [],
  });
  const [newEducation, setNewEducation] = useState<Education>({
    institution_name: "",
    degree_type: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    is_current: false,
    grade: "",
    description: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWorkExperiences();
      fetchEducation();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
        setEditedProfile(data);
      } else {
        // Create empty profile if doesn't exist
        const newProfile = {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || "",
          email: user.email || "",
        };
        setProfile(newProfile);
        setEditedProfile(newProfile);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkExperiences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("work_experiences")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (error) throw error;
      setWorkExperiences(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar experiências",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchEducation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("education")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (error) throw error;
      setEducation(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar formação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          ...editedProfile,
        });

      if (error) throw error;

      setProfile(editedProfile as Profile);
      setEditing(false);
      
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    
    const currentSkills = editedProfile.skills || [];
    if (currentSkills.includes(newSkill)) return;
    
    setEditedProfile({
      ...editedProfile,
      skills: [...currentSkills, newSkill.trim()],
    });
    setNewSkill("");
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = editedProfile.skills || [];
    setEditedProfile({
      ...editedProfile,
      skills: currentSkills.filter(skill => skill !== skillToRemove),
    });
  };

  const addWorkExperience = async () => {
    if (!user || !newWorkExp.company_name || !newWorkExp.position_title) return;

    try {
      const { error } = await supabase
        .from("work_experiences")
        .insert({
          user_id: user.id,
          ...newWorkExp,
        });

      if (error) throw error;

      await fetchWorkExperiences();
      setNewWorkExp({
        company_name: "",
        position_title: "",
        start_date: "",
        end_date: "",
        is_current: false,
        description: "",
        achievements: [],
      });

      toast({
        title: "Experiência adicionada!",
        description: "Nova experiência profissional foi adicionada ao seu perfil.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar experiência",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addEducationRecord = async () => {
    if (!user || !newEducation.institution_name || !newEducation.degree_type) return;

    try {
      const { error } = await supabase
        .from("education")
        .insert({
          user_id: user.id,
          ...newEducation,
        });

      if (error) throw error;

      await fetchEducation();
      setNewEducation({
        institution_name: "",
        degree_type: "",
        field_of_study: "",
        start_date: "",
        end_date: "",
        is_current: false,
        grade: "",
        description: "",
      });

      toast({
        title: "Formação adicionada!",
        description: "Nova formação acadêmica foi adicionada ao seu perfil.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar formação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-muted rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header with Profile Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {profile?.full_name || 'Seu Nome'}
                  </h1>
                  <div className="flex items-center space-x-4 text-muted-foreground">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {profile?.email || user?.email}
                    </div>
                    {profile?.industry && (
                      <div className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1" />
                        {profile.industry}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setEditing(!editing)}
                variant={editing ? "outline" : "default"}
              >
                {editing ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </>
                )}
              </Button>
            </div>

            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={editedProfile.full_name || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Área de Atuação</Label>
                  <Input
                    id="industry"
                    placeholder="Ex: Tecnologia, Marketing, Vendas..."
                    value={editedProfile.industry || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, industry: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Habilidades</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Digite uma habilidade..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <Button type="button" onClick={addSkill}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(editedProfile.skills || []).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer">
                        {skill}
                        <X 
                          className="w-3 h-3 ml-1" 
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Button onClick={saveProfile} className="mr-2">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.skills && profile.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Habilidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="experience" className="w-full">
          <TabsList>
            <TabsTrigger value="experience">
              <Briefcase className="w-4 h-4 mr-2" />
              Experiência
            </TabsTrigger>
            <TabsTrigger value="education">
              <GraduationCap className="w-4 h-4 mr-2" />
              Formação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="experience" className="space-y-4">
            {/* Add Work Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Experiência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Input
                      placeholder="Nome da empresa"
                      value={newWorkExp.company_name}
                      onChange={(e) => setNewWorkExp({ ...newWorkExp, company_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input
                      placeholder="Título do cargo"
                      value={newWorkExp.position_title}
                      onChange={(e) => setNewWorkExp({ ...newWorkExp, position_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Input
                      type="date"
                      value={newWorkExp.start_date}
                      onChange={(e) => setNewWorkExp({ ...newWorkExp, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Fim</Label>
                    <Input
                      type="date"
                      value={newWorkExp.end_date}
                      onChange={(e) => setNewWorkExp({ ...newWorkExp, end_date: e.target.value })}
                      disabled={newWorkExp.is_current}
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_current_work"
                        checked={newWorkExp.is_current}
                        onChange={(e) => setNewWorkExp({ 
                          ...newWorkExp, 
                          is_current: e.target.checked,
                          end_date: e.target.checked ? "" : newWorkExp.end_date
                        })}
                      />
                      <Label htmlFor="is_current_work" className="text-sm">
                        Trabalho atual
                      </Label>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descreva suas principais responsabilidades e conquistas..."
                      value={newWorkExp.description || ""}
                      onChange={(e) => setNewWorkExp({ ...newWorkExp, description: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={addWorkExperience}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Experiência
                </Button>
              </CardContent>
            </Card>

            {/* Work Experience List */}
            <div className="space-y-4">
              {workExperiences.map((exp, index) => (
                <Card key={exp.id || index}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {exp.position_title}
                        </h3>
                        <p className="text-primary font-medium mb-2">
                          {exp.company_name}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(exp.start_date).toLocaleDateString('pt-BR')} - {
                            exp.is_current 
                              ? 'Atual' 
                              : exp.end_date 
                                ? new Date(exp.end_date).toLocaleDateString('pt-BR')
                                : 'Presente'
                          }
                        </p>
                        {exp.description && (
                          <p className="text-foreground">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {workExperiences.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma experiência adicionada</h3>
                    <p className="text-muted-foreground">
                      Adicione suas experiências profissionais para fortalecer seu perfil.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="education" className="space-y-4">
            {/* Add Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Formação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Instituição</Label>
                    <Input
                      placeholder="Nome da instituição"
                      value={newEducation.institution_name}
                      onChange={(e) => setNewEducation({ ...newEducation, institution_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Formação</Label>
                    <Select 
                      value={newEducation.degree_type} 
                      onValueChange={(value) => setNewEducation({ ...newEducation, degree_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_school">Ensino Médio</SelectItem>
                        <SelectItem value="associate">Tecnólogo</SelectItem>
                        <SelectItem value="bachelor">Bacharelado</SelectItem>
                        <SelectItem value="master">Mestrado</SelectItem>
                        <SelectItem value="doctorate">Doutorado</SelectItem>
                        <SelectItem value="certificate">Certificação</SelectItem>
                        <SelectItem value="bootcamp">Bootcamp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Área de Estudo</Label>
                    <Input
                      placeholder="Ex: Ciência da Computação, Administração..."
                      value={newEducation.field_of_study || ""}
                      onChange={(e) => setNewEducation({ ...newEducation, field_of_study: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Input
                      type="date"
                      value={newEducation.start_date || ""}
                      onChange={(e) => setNewEducation({ ...newEducation, start_date: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={addEducationRecord}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Formação
                </Button>
              </CardContent>
            </Card>

            {/* Education List */}
            <div className="space-y-4">
              {education.map((edu, index) => (
                <Card key={edu.id || index}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {edu.field_of_study || edu.degree_type}
                        </h3>
                        <p className="text-primary font-medium mb-2">
                          {edu.institution_name}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>
                            {edu.start_date && new Date(edu.start_date).getFullYear()} - {
                              edu.is_current 
                                ? 'Em andamento' 
                                : edu.end_date 
                                  ? new Date(edu.end_date).getFullYear()
                                  : 'Concluído'
                            }
                          </span>
                          {edu.grade && (
                            <Badge variant="secondary">{edu.grade}</Badge>
                          )}
                        </div>
                        {edu.description && (
                          <p className="text-foreground mt-2">{edu.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {education.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma formação adicionada</h3>
                    <p className="text-muted-foreground">
                      Adicione sua formação acadêmica para completar seu perfil.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}