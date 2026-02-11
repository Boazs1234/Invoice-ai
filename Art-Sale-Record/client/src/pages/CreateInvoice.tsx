import { useLocation } from "wouter";
import { InvoiceForm } from "@/components/InvoiceForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CreateInvoice() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-muted-foreground mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        
        <div className="mb-10">
          <h1 className="font-serif text-4xl font-bold mb-2">Create New Invoice</h1>
          <p className="text-muted-foreground">Fill out the details below to generate a professional art invoice.</p>
        </div>

        <InvoiceForm onSuccess={(id) => setLocation(`/invoice/${id}`)} />
      </div>
    </div>
  );
}
