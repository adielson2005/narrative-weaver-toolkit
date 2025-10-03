import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/hooks/useNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, Briefcase, TrendingUp } from "lucide-react";

const industries = [
  "Tecnologia",
  "Saúde",
  "Educação", 
  "Finanças",
  "Marketing",
  "Vendas",
  "Recursos Humanos",
  "Design",
  "Engenharia",
  "Consultoria",
  "Outro"
];

const careerLevels = [
  "Estagiário",
  "Júnior",
  "Pleno",
  "Sênior",
  "Especialista", 
  "Coordenador",
  "Gerente",
  "Diretor",
  "VP/C-Level"
];

const commonSkills = [
  "JavaScript", "React", "Node.js", "Python", "Java", "C#", ".NET",
  "Marketing Digital", "SEO", "SEM", "Gestão de Projetos", "Scrum", "Agile",
  "Vendas", "Negociação", "Atendimento ao Cliente", "Liderança", "Comunicação",
  "Análise de Dados", "Excel", "Power BI", "SQL", "Photoshop", "Figma"
];

export default function ProfessionalGoals() {
  const { user, setOnboardingCompleted } = useNavigation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [careerLevel, setCareerLevel] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [location, setLocation] = useState("");

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills(prev => [...prev, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      // Create or update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: user.user_metadata.full_name || user.email?.split('@')[0] || '',
          email: user.email || '',
          job_title: jobTitle,
          industry: industry,
          bio: bio,
          skills: selectedSkills,
          location: location,
          career_level: careerLevel,
          onboarding_completed: true
        });

      if (profileError) throw profileError;

      // Mark onboarding as completed in localStorage
      setOnboardingCompleted(true);

      toast({
        title: "Objetivos profissionais definidos!",
        description: "Bem-vindo! Vamos explorar sua nova rede profissional.",
      });

      // Redirect to feed
      navigate("/feed", { replace: true });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar objetivos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Definir Objetivos Profissionais</CardTitle>
            <CardDescription>
              Conte-nos sobre seus objetivos para personalizarmos sua experiência no ConnectionPro
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-title">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Cargo Atual/Desejado
                  </Label>
                  <Input
                    id="job-title"
                    placeholder="Ex: Desenvolvedor Full Stack"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Área de Atuação</Label>
                  <Select value={industry} onValueChange={setIndustry} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua área" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="career-level">
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Nível de Carreira
                  </Label>
                  <Select value={careerLevel} onValueChange={setCareerLevel} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu nível" />
                    </SelectTrigger>
                    <SelectContent>
                      {careerLevels.map((level) => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    placeholder="Ex: São Paulo, SP"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Sobre você</Label>
                <Textarea
                  id="bio"
                  placeholder="Descreva brevemente sua experiência e objetivos profissionais..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label>Habilidades e Competências</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {commonSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={skill}
                        checked={selectedSkills.includes(skill)}
                        onCheckedChange={() => handleSkillToggle(skill)}
                      />
                      <Label htmlFor={skill} className="text-sm font-normal cursor-pointer">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar habilidade personalizada..."
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                  />
                  <Button type="button" variant="outline" onClick={addCustomSkill}>
                    Adicionar
                  </Button>
                </div>

                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-md">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-md cursor-pointer"
                        onClick={() => handleSkillToggle(skill)}
                      >
                        {skill} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOnboardingCompleted(true);
                    navigate("/feed", { replace: true });
                  }}
                  className="flex-1"
                >
                  Pular por enquanto
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Salvando..." : "Salvar e Continuar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}