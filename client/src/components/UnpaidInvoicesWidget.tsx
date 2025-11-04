import { useQuery, useMutation } from "@tanstack/react-query";
import { DollarSign, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@shared/schema";

interface UnpaidInvoicesResponse {
  invoices: Document[];
  count: number;
  totalAmount: number;
}

export function UnpaidInvoicesWidget() {
  const { toast } = useToast();

  const { data } = useQuery<UnpaidInvoicesResponse>({
    queryKey: ["/api/documents/unpaid-invoices"],
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/api/documents/${documentId}/payment-status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "paid" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/unpaid-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Rechnung als bezahlt markiert",
        description: "Die Rechnung wurde erfolgreich aktualisiert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Rechnung konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const markAllAsPaidMutation = useMutation({
    mutationFn: async () => {
      if (!data?.invoices) return;
      return Promise.all(
        data.invoices.map((invoice) =>
          apiRequest(`/api/documents/${invoice.id}/payment-status`, {
            method: "PATCH",
            body: JSON.stringify({ status: "paid" }),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/unpaid-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Alle Rechnungen als bezahlt markiert",
        description: `${data?.count ?? 0} Rechnungen wurden erfolgreich aktualisiert.`,
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Rechnungen konnten nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  if (!data || data.count === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Card className="mb-6" data-testid="widget-unpaid-invoices">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-orange-500" />
          Unbezahlte Rechnungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-bold text-orange-500">
              {data.count}
            </div>
            <div className="text-sm text-muted-foreground">
              {data.count === 1 ? 'Rechnung' : 'Rechnungen'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalAmount)}
            </div>
            <div className="text-sm text-muted-foreground">
              Gesamt
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.invoices.slice(0, 5).map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 hover-elevate"
              data-testid={`unpaid-invoice-${invoice.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {invoice.title}
                </div>
                {invoice.sender && (
                  <div className="text-xs text-muted-foreground truncate">
                    {invoice.sender}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {invoice.amount !== null && invoice.amount !== undefined && (
                  <Badge variant="secondary" className="font-mono">
                    {formatCurrency(invoice.amount)}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markAsPaidMutation.mutate(invoice.id)}
                  disabled={markAsPaidMutation.isPending}
                  data-testid={`button-mark-paid-${invoice.id}`}
                  className="h-7 px-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {data.count > 5 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            + {data.count - 5} weitere {data.count - 5 === 1 ? 'Rechnung' : 'Rechnungen'}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => markAllAsPaidMutation.mutate()}
          disabled={markAllAsPaidMutation.isPending}
          data-testid="button-mark-all-paid"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Alle als bezahlt markieren
        </Button>
      </CardContent>
    </Card>
  );
}
