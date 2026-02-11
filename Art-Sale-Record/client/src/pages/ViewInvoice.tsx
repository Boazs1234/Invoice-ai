import { useRoute } from "wouter";
import { useInvoice } from "@/hooks/use-invoices";
import { InvoicePreview } from "@/components/InvoicePreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function ViewInvoice() {
  const [, params] = useRoute("/invoice/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: invoice, isLoading, error } = useInvoice(id);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-serif">Invoice Not Found</h2>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-background print:bg-white pb-20">
      {/* Navigation - Hidden on Print */}
      <div className="no-print sticky top-0 z-20 bg-white/95 dark:bg-card/95 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-auto sm:w-auto sm:px-3 touch-manipulation" data-testid="button-back">
              <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-2">Dashboard</span>
            </Button>
          </Link>
          <span className="text-muted-foreground text-xs sm:text-sm font-mono truncate">#{invoice.invoiceNumber}</span>
        </div>
        
        <Link href={`/edit/${invoice.id}`}>
          <Button variant="secondary" className="h-10 sm:h-9 px-3 sm:px-4 gap-2 touch-manipulation" data-testid="button-edit">
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-2 sm:px-6 pt-4">
        <InvoicePreview invoice={invoice} />
      </div>
    </div>
  );
}
