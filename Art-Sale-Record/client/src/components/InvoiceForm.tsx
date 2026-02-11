import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema, type InsertInvoice, type Invoice } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { z } from "zod";

const formSchema = insertInvoiceSchema.extend({
  price: z.string().or(z.number()).transform(v => String(v)),
  taxRate: z.string().or(z.number()).optional().transform(v => String(v || "0")),
  taxAmount: z.string().or(z.number()).optional().transform(v => String(v || "0")),
  shippingFees: z.string().or(z.number()).optional().transform(v => String(v || "0")),
  totalAmount: z.string().or(z.number()).transform(v => String(v)),
});

interface InvoiceFormProps {
  initialData?: Invoice;
  onSuccess?: (id: number) => void;
}

function ImageUpload({ 
  value, 
  onChange, 
  label 
}: { 
  value?: string | null; 
  onChange: (url: string | null) => void; 
  label: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const { url } = await res.json();
        onChange(url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Preview" className="w-32 h-32 object-cover border" />
          <button 
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
            data-testid="button-remove-image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`file-${label}`)?.click()}
          data-testid="dropzone-image-upload"
        >
          <input
            id={`file-${label}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            data-testid="input-file-upload"
          />
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          ) : (
            <>
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drop image or click to upload</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function InvoiceForm({ initialData, onSuccess }: InvoiceFormProps) {
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  
  const isEditing = !!initialData;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      invoiceNumber: `${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: "USD",
      taxRate: "0",
      taxAmount: "0",
      shippingFees: "0",
      totalAmount: "0",
      price: "0",
      paymentTerms: "Payment is due within 30 days of receiving this invoice.",
      notes: "Certificate of Authenticity included. Thank you for your business!",
    },
  });

  const price = form.watch("price");
  const taxRate = form.watch("taxRate");
  const shippingFees = form.watch("shippingFees");

  useEffect(() => {
    const p = parseFloat(String(price) || "0");
    const tr = parseFloat(String(taxRate) || "0");
    const sf = parseFloat(String(shippingFees) || "0");

    const calculatedTax = p * (tr / 100);
    const total = p + calculatedTax + sf;

    form.setValue("taxAmount", calculatedTax.toFixed(2));
    form.setValue("totalAmount", total.toFixed(2));
  }, [price, taxRate, shippingFees, form]);

  const onSubmit = (data: InsertInvoice) => {
    if (isEditing && initialData) {
      updateMutation.mutate({ id: initialData.id, ...data }, {
        onSuccess: (updated) => onSuccess?.(updated.id)
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: (created) => onSuccess?.(created.id)
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-500">
        
        {/* Logo Upload */}
        <div className="bg-white dark:bg-card p-6 border border-border/60">
          <h3 className="font-serif text-lg font-medium mb-4">Your Logo (Optional)</h3>
          <FormField control={form.control} name="logoUrl" render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload 
                  value={field.value} 
                  onChange={field.onChange} 
                  label="Logo"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Invoice Header */}
        <div className="bg-white dark:bg-card p-6 border border-border/60">
          <h3 className="font-serif text-lg font-medium mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Invoice No.</FormLabel>
                <FormControl>
                  <Input {...field} className="text-lg font-mono" data-testid="input-invoice-number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="invoiceDate" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-invoice-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="paymentDueDate" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Payment Due</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ''} data-testid="input-payment-due" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Billed To / Pay To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-card p-6 border border-border/60">
            <h3 className="font-serif text-lg font-medium mb-4">Billed To</h3>
            <div className="space-y-4">
              <FormField control={form.control} name="buyerName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl><Input {...field} data-testid="input-buyer-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="buyerAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Textarea {...field} rows={3} data-testid="input-buyer-address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="buyerPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} data-testid="input-buyer-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="buyerEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} value={field.value || ''} data-testid="input-buyer-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          <div className="bg-white dark:bg-card p-6 border border-border/60">
            <h3 className="font-serif text-lg font-medium mb-4">Pay To</h3>
            <div className="space-y-4">
              <FormField control={form.control} name="artistName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl><Input {...field} data-testid="input-artist-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="artistAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Textarea {...field} rows={3} data-testid="input-artist-address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="artistPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} data-testid="input-artist-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="artistEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} data-testid="input-artist-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="bg-white dark:bg-card p-6 border border-border/60">
          <FormField control={form.control} name="paymentTerms" render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Terms</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ''} 
                  rows={2}
                  placeholder="Payment is due within [x] days of receiving this invoice by [accepted payment types]."
                  data-testid="input-payment-terms"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Artwork Details */}
        <div className="bg-white dark:bg-card p-6 border border-border/60">
          <h3 className="font-serif text-lg font-medium mb-4">Artwork</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <FormField control={form.control} name="artistName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist Name (on invoice)</FormLabel>
                  <FormControl><Input {...field} data-testid="input-artwork-artist" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="artworkTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} className="font-serif italic" data-testid="input-artwork-title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="artworkYear" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl><Input {...field} data-testid="input-artwork-year" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="artworkMedium" render={({ field }) => (
                <FormItem>
                  <FormLabel>Medium</FormLabel>
                  <FormControl><Input {...field} data-testid="input-artwork-medium" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="editionNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edition (Optional)</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} placeholder="e.g., 1/10" data-testid="input-artwork-edition" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="artworkDimensions" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl><Input {...field} placeholder='e.g., 24" x 36"' data-testid="input-artwork-dimensions" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
            <div>
              <FormField control={form.control} name="artworkImageUrl" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload 
                      value={field.value} 
                      onChange={field.onChange} 
                      label="Thumbnail Image (Optional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white dark:bg-card p-6 border border-border/60">
          <h3 className="font-serif text-lg font-medium mb-4">Pricing</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground">Artwork Price</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        className="text-right font-mono w-32"
                        data-testid="input-price"
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground">Shipping</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <FormField control={form.control} name="shippingFees" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        value={field.value || ''}
                        className="text-right font-mono w-32"
                        data-testid="input-shipping"
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground">Tax Rate (%)</span>
              <FormField control={form.control} name="taxRate" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      value={field.value || ''}
                      className="text-right font-mono w-32"
                      data-testid="input-tax-rate"
                    />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground">Tax Amount</span>
              <span className="font-mono">${form.watch("taxAmount")}</span>
            </div>
            <div className="flex items-center justify-between py-4 bg-muted/30 px-4 -mx-4">
              <span className="font-serif text-xl font-medium">Total</span>
              <span className="font-mono text-2xl font-bold">${form.watch("totalAmount")}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-card p-6 border border-border/60">
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ''} 
                  rows={2}
                  placeholder="Thank you for your business!"
                  data-testid="input-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <Button type="submit" size="lg" disabled={isPending} data-testid="button-submit-invoice">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEditing ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
