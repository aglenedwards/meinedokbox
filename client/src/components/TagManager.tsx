import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, X, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
}

interface TagManagerProps {
  documentId: string;
  onClose?: () => void;
}

export function TagManager({ documentId, onClose }: TagManagerProps) {
  const [newTagName, setNewTagName] = useState("");
  const { toast } = useToast();

  // Fetch all available tags for the user
  const { data: allTags = [], isLoading: isLoadingAllTags } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });

  // Fetch tags assigned to this document
  const { data: documentTags = [], isLoading: isLoadingDocTags } = useQuery<Tag[]>({
    queryKey: ['/api/documents', documentId, 'tags'],
  });

  // Create new tag
  const createTagMutation = useMutation({
    mutationFn: async (tagName: string) => {
      const res = await apiRequest('POST', `/api/tags`, { name: tagName });
      return await res.json();
    },
    onSuccess: (newTag: Tag) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setNewTagName("");
      // Auto-assign the new tag to the document
      addTagMutation.mutate(newTag.id);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Tag konnte nicht erstellt werden",
      });
    },
  });

  // Add tag to document
  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const res = await apiRequest('POST', `/api/documents/${documentId}/tags/${tagId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Erfolg",
        description: "Tag hinzugefügt",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Tag konnte nicht hinzugefügt werden",
      });
    },
  });

  // Remove tag from document
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const res = await apiRequest('DELETE', `/api/documents/${documentId}/tags/${tagId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Erfolg",
        description: "Tag entfernt",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Tag konnte nicht entfernt werden",
      });
    },
  });

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTagMutation.mutate(newTagName.trim());
    }
  };

  const handleToggleTag = (tagId: string) => {
    const isAssigned = documentTags.some(t => t.id === tagId);
    if (isAssigned) {
      removeTagMutation.mutate(tagId);
    } else {
      addTagMutation.mutate(tagId);
    }
  };

  const documentTagIds = new Set(documentTags.map(t => t.id));

  return (
    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto" data-testid="tag-manager">
      <div>
        <h4 className="font-semibold text-sm mb-3">Neues Tag erstellen</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Tag-Name eingeben..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            data-testid="input-new-tag"
          />
          <Button
            onClick={handleCreateTag}
            disabled={!newTagName.trim() || createTagMutation.isPending}
            size="icon"
            data-testid="button-create-tag"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-3">Verfügbare Tags</h4>
        {isLoadingAllTags || isLoadingDocTags ? (
          <div className="text-sm text-muted-foreground">Laden...</div>
        ) : allTags.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Noch keine Tags vorhanden. Erstellen Sie Ihr erstes Tag!
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isAssigned = documentTagIds.has(tag.id);
              return (
                <Badge
                  key={tag.id}
                  variant={isAssigned ? "default" : "outline"}
                  className="cursor-pointer hover-elevate gap-1"
                  onClick={() => handleToggleTag(tag.id)}
                  data-testid={`badge-tag-${tag.id}`}
                >
                  <TagIcon className="h-3 w-3" />
                  {tag.name}
                  {isAssigned && <X className="h-3 w-3 ml-1" />}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface TagButtonProps {
  documentId: string;
}

export function TagButton({ documentId }: TagButtonProps) {
  const [open, setOpen] = useState(false);

  // Fetch tags assigned to this document
  const { data: documentTags = [] } = useQuery<Tag[]>({
    queryKey: ['/api/documents', documentId, 'tags'],
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1"
          onClick={(e) => e.stopPropagation()}
          data-testid={`button-tag-${documentId}`}
        >
          <TagIcon className="h-3.5 w-3.5" />
          <span className="text-xs">
            {documentTags.length > 0 ? `${documentTags.length}` : 'Tags'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" onClick={(e) => e.stopPropagation()}>
        <TagManager documentId={documentId} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
