import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertInvoice } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useInvoices() {
  return useQuery({
    queryKey: [api.invoices.list.path],
    queryFn: async () => {
      const res = await fetch(api.invoices.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return api.invoices.list.responses[200].parse(await res.json());
    },
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: [api.invoices.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.invoices.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return api.invoices.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertInvoice) => {
      // Ensure numerics are strings if they aren't already
      const payload = {
        ...data,
        price: String(data.price),
        taxRate: String(data.taxRate || "0"),
        taxAmount: String(data.taxAmount || "0"),
        shippingFees: String(data.shippingFees || "0"),
        totalAmount: String(data.totalAmount),
      };

      const res = await fetch(api.invoices.create.path, {
        method: api.invoices.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.invoices.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create invoice");
      }
      return api.invoices.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      toast({
        title: "Invoice Created",
        description: "The invoice has been successfully saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertInvoice>) => {
      const url = buildUrl(api.invoices.update.path, { id });
      
      // Ensure numerics are strings - use !== undefined to catch "0" values
      const payload: any = { ...updates };
      if (payload.price !== undefined) payload.price = String(payload.price);
      if (payload.taxRate !== undefined) payload.taxRate = String(payload.taxRate);
      if (payload.taxAmount !== undefined) payload.taxAmount = String(payload.taxAmount);
      if (payload.shippingFees !== undefined) payload.shippingFees = String(payload.shippingFees);
      if (payload.totalAmount !== undefined) payload.totalAmount = String(payload.totalAmount);

      const res = await fetch(url, {
        method: api.invoices.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error("Invoice not found");
        throw new Error("Failed to update invoice");
      }
      return api.invoices.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.invoices.get.path, variables.id] });
      toast({
        title: "Invoice Updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.invoices.delete.path, { id });
      const res = await fetch(url, {
        method: api.invoices.delete.method,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error("Invoice not found");
        throw new Error("Failed to delete invoice");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
