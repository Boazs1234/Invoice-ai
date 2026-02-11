import { useRoute, useLocation } from "wouter";
import { useInvoice } from "@/hooks/use-invoices";
import { InvoiceForm } from "@/components/InvoiceForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function EditInvoice() {
  const [, params] = useRoute("/edit/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: invoice, isLoading, error } = useInvoice(id);
  const [, setLocation] = useLocation();

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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-muted-foreground mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        
        <div className="mb-10">
          <h1 className="font-serif text-4xl font-bold mb-2">Edit Invoice</h1>
          <p className="text-muted-foreground font-mono">{invoice.invoiceNumber}</p>
        </div>

        <InvoiceForm 
          initialData={invoice} 
          onSuccess={() => setLocation(`/invoice/${id}`)} 
        />
      </div>
    </div>
  );
}
