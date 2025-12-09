import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lightbulb, ThumbsUp, Plus, CheckCircle2, Clock, Rocket, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardFooter } from "@/components/DashboardFooter";
import type { FeatureRequest } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(5, "Titel muss mindestens 5 Zeichen haben").max(100, "Titel darf maximal 100 Zeichen haben"),
  description: z.string().min(20, "Beschreibung muss mindestens 20 Zeichen haben").max(1000, "Beschreibung darf maximal 1000 Zeichen haben"),
});

type FormValues = z.infer<typeof formSchema>;

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "In Prüfung", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock },
  approved: { label: "Genehmigt", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: CheckCircle2 },
  planned: { label: "Geplant", color: "bg-purple-500/10 text-purple-600 border-purple-200", icon: Rocket },
  in_progress: { label: "In Arbeit", color: "bg-orange-500/10 text-orange-600 border-orange-200", icon: Rocket },
  completed: { label: "Umgesetzt", color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Abgelehnt", color: "bg-red-500/10 text-red-600 border-red-200", icon: Clock },
};

export default function WunschFeatures() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const { data: featureRequests = [], isLoading } = useQuery<FeatureRequest[]>({
    queryKey: ["/api/feature-requests"],
  });

  const { data: myVotes = [] } = useQuery<string[]>({
    queryKey: ["/api/my-votes"],
  });

  const { data: user } = useQuery<{ id: string }>({
    queryKey: ["/api/auth/user"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/feature-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feature-requests"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Vorschlag eingereicht",
        description: "Ihr Feature-Vorschlag wird geprüft und nach Freigabe sichtbar.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Vorschlag konnte nicht eingereicht werden.",
        variant: "destructive",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "add" | "remove" }) => {
      return apiRequest(action === "add" ? "POST" : "DELETE", `/api/feature-requests/${id}/vote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feature-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-votes"] });
    },
  });

  const hasVoted = (id: string) => myVotes.includes(id);

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
                <Lightbulb className="h-6 w-6 text-primary" />
                Wunsch-Features
              </h1>
              <p className="text-muted-foreground mt-1">
                Teilen Sie Ihre Ideen und stimmen Sie für Vorschläge anderer Nutzer ab.
              </p>
            </div>
            
            {user && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-feature">
                    <Plus className="h-4 w-4 mr-2" />
                    Vorschlag einreichen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neuen Feature-Vorschlag einreichen</DialogTitle>
                    <DialogDescription>
                      Beschreiben Sie Ihre Idee. Nach Prüfung wird sie für andere Nutzer sichtbar.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Titel</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Kurze Beschreibung Ihrer Idee..." 
                                {...field} 
                                data-testid="input-feature-title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Beschreibung</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Beschreiben Sie Ihre Idee ausführlich..."
                                className="min-h-[120px]"
                                {...field}
                                data-testid="input-feature-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setDialogOpen(false)}
                          data-testid="button-cancel"
                        >
                          Abbrechen
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending}
                          data-testid="button-submit-feature"
                        >
                          {createMutation.isPending ? "Wird eingereicht..." : "Einreichen"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-2/3 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : featureRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Noch keine Vorschläge</h3>
                <p className="text-muted-foreground mb-4">
                  Seien Sie der Erste, der eine Idee einreicht!
                </p>
                {user && (
                  <Button onClick={() => setDialogOpen(true)} data-testid="button-first-feature">
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Vorschlag einreichen
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {featureRequests.map((feature) => {
                const status = statusConfig[feature.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const voted = hasVoted(feature.id);

                return (
                  <Card key={feature.id} data-testid={`card-feature-${feature.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                          <CardDescription className="mt-2 whitespace-pre-wrap">
                            {feature.description}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {user ? (
                            <Button
                              variant={voted ? "default" : "outline"}
                              size="sm"
                              onClick={() => voteMutation.mutate({ 
                                id: feature.id, 
                                action: voted ? "remove" : "add" 
                              })}
                              disabled={voteMutation.isPending}
                              data-testid={`button-vote-${feature.id}`}
                            >
                              <ThumbsUp className={`h-4 w-4 mr-1 ${voted ? "fill-current" : ""}`} />
                              {voted ? "Abgestimmt" : "Abstimmen"}
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled>
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Einloggen zum Abstimmen
                            </Button>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {feature.voteCount} {feature.voteCount === 1 ? "Stimme" : "Stimmen"}
                          </span>
                        </div>
                        {feature.adminNote && (
                          <p className="text-sm text-muted-foreground italic">
                            Admin: {feature.adminNote}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <DashboardFooter />
    </DashboardLayout>
  );
}
