import { useRef, useState, useCallback } from "react";
import type { Invoice } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface InvoicePreviewProps {
  invoice: Invoice;
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  
  const handlePrint = useCallback(() => {
    if (!componentRef.current) return;
    
    const printContent = componentRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the invoice');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice-${invoice.invoiceNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Playfair Display', Georgia, serif;
              padding: 0.75in;
              background: white;
              color: black;
            }
            .font-sans { font-family: system-ui, sans-serif; }
            .font-mono { font-family: ui-monospace, monospace; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-base { font-size: 1rem; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-3xl { font-size: 1.875rem; }
            .text-4xl { font-size: 2.25rem; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            .tracking-wide { letter-spacing: 0.025em; }
            .tracking-widest { letter-spacing: 0.1em; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .whitespace-pre-line { white-space: pre-line; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mb-12 { margin-bottom: 3rem; }
            .mt-2 { margin-top: 0.5rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .pt-3 { padding-top: 0.75rem; }
            .pt-4 { padding-top: 1rem; }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }
            .gap-8 { gap: 2rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .flex-row { flex-direction: row; }
            .flex-1 { flex: 1; }
            .flex-shrink-0 { flex-shrink: 0; }
            .flex-wrap { flex-wrap: wrap; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .justify-end { justify-content: flex-end; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .border { border: 1px solid #d1d5db; }
            .border-t { border-top: 1px solid #d1d5db; }
            .border-b { border-bottom: 1px solid #d1d5db; }
            .border-t-2 { border-top: 2px solid black; }
            .border-l-4 { border-left: 4px solid #d1d5db; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-gray-300 { border-color: #d1d5db; }
            .bg-gray-50 { background-color: #f9fafb; }
            .w-32 { width: 8rem; }
            .h-12 { height: 3rem; }
            .h-16 { height: 4rem; }
            .h-32 { height: 8rem; }
            .w-64 { width: 16rem; }
            .object-contain { object-fit: contain; }
            .object-cover { object-fit: cover; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  }, [invoice.invoiceNumber]);

  const handleSavePdf = async () => {
    if (!componentRef.current) return;
    
    setSavingPdf(true);
    try {
      const element = componentRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95;
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Failed to save PDF:', error);
      alert('Failed to save PDF. Please try again.');
    } finally {
      setSavingPdf(false);
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    const num = Number(amount) || 0;
    return num.toLocaleString('en-US', { 
      style: 'currency', 
      currency: invoice.currency || 'USD',
      minimumFractionDigits: 2 
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-8">
      {/* Action Buttons - Mobile Optimized */}
      <div className="w-full flex flex-col sm:flex-row justify-center gap-3 no-print py-3 px-4">
        <Button 
          onClick={handlePrint}
          variant="outline" 
          className="gap-2 h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
          data-testid="button-print"
        >
          <Printer className="w-5 h-5 sm:w-4 sm:h-4" />
          Print Invoice
        </Button>
        <Button 
          onClick={handleSavePdf} 
          disabled={savingPdf}
          className="gap-2 h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
          data-testid="button-save-pdf"
        >
          {savingPdf ? (
            <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Download className="w-5 h-5 sm:w-4 sm:h-4" />
          )}
          Save as PDF
        </Button>
      </div>

      {/* Invoice Document - Responsive */}
      <div 
        className="print-area w-full bg-white text-black p-6 sm:p-12 max-w-[210mm] mx-auto relative border shadow-lg" 
        ref={componentRef}
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {/* Logo */}
        {invoice.logoUrl && (
          <div className="mb-6 sm:mb-8">
            <img src={invoice.logoUrl} alt="Logo" className="h-12 sm:h-16 object-contain" />
          </div>
        )}

        {/* Invoice Title */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
            INVOICE
          </h1>
        </div>

        {/* Billed To / Pay To - Stack on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-sans">Billed to:</p>
            <p className="font-semibold">{invoice.buyerName}</p>
            <p className="text-sm whitespace-pre-line text-gray-700">{invoice.buyerAddress}</p>
            {invoice.buyerPhone && <p className="text-sm text-gray-700">{invoice.buyerPhone}</p>}
            {invoice.buyerEmail && <p className="text-sm text-gray-700">{invoice.buyerEmail}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-sans">Pay to:</p>
            <p className="font-semibold">{invoice.artistName}</p>
            <p className="text-sm whitespace-pre-line text-gray-700">{invoice.artistAddress}</p>
            {invoice.artistPhone && <p className="text-sm text-gray-700">{invoice.artistPhone}</p>}
            <p className="text-sm text-gray-700">{invoice.artistEmail}</p>
          </div>
        </div>

        {/* Payment Terms */}
        {invoice.paymentTerms && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-gray-50 border-l-4 border-gray-300">
            <p className="text-sm text-gray-700 italic">{invoice.paymentTerms}</p>
          </div>
        )}

        {/* Invoice Number & Dates - Side by Side on Mobile */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6 sm:mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-sans">Invoice No.</p>
            <p className="text-lg font-mono font-bold">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right space-y-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-sans">Date:</p>
              <p className="font-mono">{format(new Date(invoice.invoiceDate), 'M/d/yyyy')}</p>
            </div>
            {invoice.paymentDueDate && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-sans">Payment due:</p>
                <p className="font-mono">{format(new Date(invoice.paymentDueDate), 'M/d/yyyy')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Artwork Section - Responsive */}
        <div className="border-t border-b border-gray-300 py-4 sm:py-6 mb-6 sm:mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-sans">Artwork</p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {invoice.artworkImageUrl && (
              <div className="flex-shrink-0 flex justify-center sm:justify-start">
                <img 
                  src={invoice.artworkImageUrl} 
                  alt={invoice.artworkTitle}
                  className="w-24 h-24 sm:w-32 sm:h-32 object-cover border border-gray-200"
                />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold">{invoice.artistName}</p>
              <p className="text-base sm:text-lg italic mb-1">
                {invoice.artworkTitle}, {invoice.artworkYear}
              </p>
              <p className="text-sm text-gray-600">{invoice.artworkMedium}</p>
              {invoice.editionNumber && (
                <p className="text-sm text-gray-600">{invoice.editionNumber}</p>
              )}
              <p className="text-sm text-gray-600">{invoice.artworkDimensions}</p>
            </div>
            <div className="text-center sm:text-right mt-2 sm:mt-0">
              <p className="text-xl font-mono font-bold">{formatCurrency(invoice.price)}</p>
            </div>
          </div>
        </div>

        {/* Thank You */}
        {invoice.notes && (
          <div className="mb-6 sm:mb-8 text-center">
            <p className="italic text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Totals - Full Width on Mobile */}
        <div className="flex justify-center sm:justify-end">
          <div className="w-full sm:w-64 space-y-2">
            <div className="border-t border-gray-300 pt-4">
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-mono">{formatCurrency(invoice.price)}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-mono">{formatCurrency(invoice.shippingFees)}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Tax:</span>
                <span className="font-mono">{formatCurrency(invoice.taxAmount)}</span>
              </div>
            </div>
            <div className="border-t-2 border-black pt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-mono text-xl font-bold">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { 
            box-shadow: none !important; 
            border: none !important;
            margin: 0 !important;
            padding: 1in !important;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
