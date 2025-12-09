import { useQuery } from "@tanstack/react-query";
import { PlayCircle, Upload, FolderOpen, Search, Settings, Tag, Mail, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardFooter } from "@/components/DashboardFooter";
import type { VideoTutorial } from "@shared/schema";

const categoryIcons: Record<string, typeof Upload> = {
  "Upload": Upload,
  "Ordner": FolderOpen,
  "Suche": Search,
  "Einstellungen": Settings,
  "Tags": Tag,
  "E-Mail": Mail,
  "Teilen": Users,
};

const categoryColors: Record<string, string> = {
  "Upload": "bg-blue-500/10 text-blue-600 border-blue-200",
  "Ordner": "bg-purple-500/10 text-purple-600 border-purple-200",
  "Suche": "bg-green-500/10 text-green-600 border-green-200",
  "Einstellungen": "bg-orange-500/10 text-orange-600 border-orange-200",
  "Tags": "bg-pink-500/10 text-pink-600 border-pink-200",
  "E-Mail": "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  "Teilen": "bg-indigo-500/10 text-indigo-600 border-indigo-200",
};

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return url;
}

export default function VideoTutorials() {
  const { data: tutorials = [], isLoading } = useQuery<VideoTutorial[]>({
    queryKey: ["/api/video-tutorials"],
  });

  const groupedByCategory = tutorials.reduce((acc, tutorial) => {
    const category = tutorial.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tutorial);
    return acc;
  }, {} as Record<string, VideoTutorial[]>);

  const categories = Object.keys(groupedByCategory);

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <PlayCircle className="h-6 w-6 text-primary" />
              Video-Tutorials
            </h1>
            <p className="text-muted-foreground mt-1">
              Lernen Sie alle Funktionen von MeineDokBox mit unseren kurzen Video-Anleitungen.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted rounded-t-lg" />
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : tutorials.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Noch keine Videos verfügbar</h3>
                <p className="text-muted-foreground">
                  Video-Tutorials werden in Kürze hinzugefügt.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-10">
              {categories.map((category) => {
                const Icon = categoryIcons[category] || PlayCircle;
                const colorClass = categoryColors[category] || "bg-gray-500/10 text-gray-600 border-gray-200";
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className={colorClass}>
                        <Icon className="h-3.5 w-3.5 mr-1" />
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {groupedByCategory[category].length} {groupedByCategory[category].length === 1 ? "Video" : "Videos"}
                      </span>
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                      {groupedByCategory[category].map((tutorial) => {
                        const embedUrl = getYouTubeEmbedUrl(tutorial.videoUrl);
                        
                        return (
                          <Card key={tutorial.id} data-testid={`card-tutorial-${tutorial.id}`}>
                            <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                              {embedUrl ? (
                                <iframe
                                  src={embedUrl}
                                  title={tutorial.title}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <video
                                  src={tutorial.videoUrl}
                                  controls
                                  className="w-full h-full object-cover"
                                  poster={tutorial.thumbnailUrl || undefined}
                                />
                              )}
                            </div>
                            <CardHeader>
                              <CardTitle className="text-base">{tutorial.title}</CardTitle>
                              {tutorial.description && (
                                <CardDescription>{tutorial.description}</CardDescription>
                              )}
                            </CardHeader>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
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
