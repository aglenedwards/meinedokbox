import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Send, Mail, Clock, CheckCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  subject: z.string().min(3, "Betreff muss mindestens 3 Zeichen lang sein"),
  message: z.string().min(10, "Nachricht muss mindestens 10 Zeichen lang sein"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Kontakt() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    // Simuliere Formular-Versand
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Contact form data:", data);
    
    toast({
      title: "Nachricht gesendet!",
      description: "Wir haben Ihre Nachricht erhalten und melden uns in Kürze bei Ihnen.",
    });
    
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 hero-premium-bg">
        {/* Premium Mesh Gradient Background */}
        <div className="absolute inset-0 hero-mesh-gradient" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/80 backdrop-blur-sm mb-8 shadow-lg">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Wir antworten innerhalb von 24 Stunden</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight" data-testid="text-contact-title">
              Wir helfen
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                gerne weiter
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Haben Sie Fragen zu MeineDokBox? Möchten Sie Feedback geben? 
              Kontaktieren Sie uns – wir freuen uns auf Ihre Nachricht!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-24 section-premium-subtle">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="card-premium hover-elevate">
                <CardHeader>
                  <CardTitle className="text-2xl">Kontaktformular</CardTitle>
                  <CardDescription>
                    Füllen Sie das Formular aus und wir melden uns schnellstmöglich bei Ihnen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Max Mustermann"
                                  {...field}
                                  data-testid="input-contact-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-Mail</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="max@beispiel.de"
                                  {...field}
                                  data-testid="input-contact-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Betreff</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Worum geht es?"
                                {...field}
                                data-testid="input-contact-subject"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nachricht</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ihre Nachricht an uns..."
                                className="min-h-[150px] resize-none"
                                {...field}
                                data-testid="textarea-contact-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting}
                        data-testid="button-contact-submit"
                      >
                        {isSubmitting ? (
                          <>
                            <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                            Wird gesendet...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Nachricht senden
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              {/* Direct Contact */}
              <Card className="card-premium hover-elevate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5 text-primary" />
                    Direkter Kontakt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">E-Mail Support</p>
                    <a 
                      href="mailto:service@meinedokbox.de" 
                      className="text-primary hover:underline font-medium"
                      data-testid="link-email"
                    >
                      service@meinedokbox.de
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="card-premium hover-elevate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    Antwortzeit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Werktags innerhalb von 24h</p>
                      <p className="text-sm text-muted-foreground">Montag - Freitag, 9:00 - 18:00 Uhr</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Am Wochenende</p>
                      <p className="text-sm text-muted-foreground">Montag-Vormittag Bearbeitung</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help Topics */}
              <Card className="card-premium hover-elevate">
                <CardHeader>
                  <CardTitle className="text-lg">Häufige Themen</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Account & Abonnements</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Technischer Support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Feature-Anfragen</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Datenschutz & Sicherheit</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
