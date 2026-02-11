import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useInvoices, useDeleteInvoice } from "@/hooks/use-invoices";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Edit, FileText, ChevronDown, ChevronRight, User, Palette, Calendar, LogOut, LogIn, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Invoice } from "@shared/schema";

type GroupBy = "none" | "artist" | "client" | "date";

export default function Home() {
  const { data: invoices, isLoading } = useInvoices();
  const deleteMutation = useDeleteInvoice();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const filteredInvoices = useMemo(() => {
    return invoices?.filter(inv => 
      inv.buyerName.toLowerCase().includes(search.toLowerCase()) || 
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.artworkTitle.toLowerCase().includes(search.toLowerCase()) ||
      inv.artistName.toLowerCase().includes(search.toLowerCase())
    ) || [];
  }, [invoices, search]);

  const groupedInvoices = useMemo(() => {
    if (groupBy === "none") return null;
    
    const groups: Record<string, Invoice[]> = {};
    
    filteredInvoices.forEach(invoice => {
      let key: string;
      switch (groupBy) {
        case "artist":
          key = invoice.artistName;
          break;
        case "client":
          key = invoice.buyerName;
          break;
        case "date":
          key = format(new Date(invoice.invoiceDate), 'MMMM yyyy');
          break;
        default:
          key = "Other";
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(invoice);
    });
    
    return Object.entries(groups).sort((a, b) => {
      if (groupBy === "date") {
        return new Date(b[1][0].invoiceDate).getTime() - new Date(a[1][0].invoiceDate).getTime();
      }
      return a[0].localeCompare(b[0]);
    });
  }, [filteredInvoices, groupBy]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAllGroups = () => {
    if (groupedInvoices) {
      const allKeys = groupedInvoices.map(([key]) => key);
      const allExpanded = allKeys.every(key => expandedGroups.has(key));
      if (allExpanded) {
        setExpandedGroups(new Set());
      } else {
        setExpandedGroups(new Set(allKeys));
      }
    }
  };

  const isExampleInvoice = (invoice: Invoice) => invoice.userId === null;

  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => (
    <div className="group bg-white dark:bg-card border border-border/40 p-4 sm:p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-300 hover:border-primary/20">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground shrink-0">{invoice.invoiceNumber}</span>
          {isExampleInvoice(invoice) && (
            <span className="text-xs text-primary/70 px-1.5 py-0.5 bg-primary/10 rounded uppercase tracking-wider shrink-0">
              Example
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded-full uppercase tracking-wider shrink-0">
          {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
        </span>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-serif text-lg sm:text-xl font-semibold leading-tight line-clamp-2">{invoice.artworkTitle}</h3>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground/70">by</span> <span className="font-medium text-foreground">{invoice.artistName}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground/70">for</span> <span className="font-medium text-foreground">{invoice.buyerName}</span>
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/30">
        <div>
          <p className="font-mono text-lg font-bold">
            {Number(invoice.totalAmount).toLocaleString('en-US', { style: 'currency', currency: invoice.currency })}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Link href={`/invoice/${invoice.id}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 touch-manipulation" data-testid={`button-view-${invoice.id}`}>
              <FileText className="w-4 h-4" />
            </Button>
          </Link>
          {!isExampleInvoice(invoice) && (
            <>
              <Link href={`/edit/${invoice.id}`}>
                <Button variant="ghost" size="icon" className="h-9 w-9 touch-manipulation" data-testid={`button-edit-${invoice.id}`}>
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive touch-manipulation" data-testid={`button-delete-${invoice.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm mx-4">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif">Delete Invoice?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the invoice for 
                      <span className="font-semibold text-foreground"> {invoice.artworkTitle}</span>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteMutation.mutate(invoice.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start sm:gap-6 border-b border-border pb-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mb-1 text-primary">Invoices</h1>
            <p className="text-muted-foreground text-base sm:text-lg">Manage art sales and documentation.</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {authLoading ? (
              <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            ) : user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 gap-2 touch-manipulation" data-testid="button-user-menu">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">{user.firstName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-sm">
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-muted-foreground text-xs">{user.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer" data-testid="button-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link href="/create">
                  <Button size="lg" className="h-10 text-base touch-manipulation bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" data-testid="button-new-invoice">
                    <Plus className="mr-2 h-5 w-5" /> New Invoice
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="outline" className="h-10 gap-2 touch-manipulation" data-testid="button-signin">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="h-10 gap-2 touch-manipulation" data-testid="button-signup">
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Search and Group By Controls */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search invoices..." 
              className="pl-10 h-11 sm:h-10 text-base sm:text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
            <Button 
              variant={groupBy === "none" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setGroupBy("none")}
              className="h-8 px-3 text-xs sm:text-sm touch-manipulation"
              data-testid="button-group-none"
            >
              All
            </Button>
            <Button 
              variant={groupBy === "artist" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => { setGroupBy("artist"); setExpandedGroups(new Set()); }}
              className="h-8 px-3 text-xs sm:text-sm gap-1.5 touch-manipulation"
              data-testid="button-group-artist"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">By</span> Artist
            </Button>
            <Button 
              variant={groupBy === "client" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => { setGroupBy("client"); setExpandedGroups(new Set()); }}
              className="h-8 px-3 text-xs sm:text-sm gap-1.5 touch-manipulation"
              data-testid="button-group-client"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">By</span> Client
            </Button>
            <Button 
              variant={groupBy === "date" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => { setGroupBy("date"); setExpandedGroups(new Set()); }}
              className="h-8 px-3 text-xs sm:text-sm gap-1.5 touch-manipulation"
              data-testid="button-group-date"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">By</span> Date
            </Button>
          </div>
        </div>

        {/* Invoice List */}
        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-40 w-full bg-card border border-border/50 animate-pulse rounded-md" />
            ))
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-20 bg-card border border-dashed border-border rounded-md">
              <p className="text-muted-foreground">
                {user ? "No invoices yet. Create your first one." : "Sign in to view and manage your invoices."}
              </p>
              {!user && (
                <div className="mt-4 flex justify-center gap-3">
                  <Link href="/signin">
                    <Button variant="outline" data-testid="button-signin-empty">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button data-testid="button-signup-empty">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : groupBy === "none" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {groupedInvoices?.length && groupedInvoices.length > 1 && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={toggleAllGroups} className="text-xs">
                    {groupedInvoices.every(([key]) => expandedGroups.has(key)) ? "Collapse All" : "Expand All"}
                  </Button>
                </div>
              )}
              {groupedInvoices?.map(([groupName, groupInvoices]) => (
                <Collapsible 
                  key={groupName} 
                  open={expandedGroups.has(groupName)}
                  onOpenChange={() => toggleGroup(groupName)}
                >
                  <CollapsibleTrigger asChild>
                    <button 
                      className="w-full flex items-center justify-between p-4 bg-card border border-border/60 hover:bg-muted/50 transition-colors touch-manipulation"
                      data-testid={`button-group-${groupName}`}
                    >
                      <div className="flex items-center gap-3">
                        {expandedGroups.has(groupName) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-serif text-lg font-medium">{groupName}</span>
                        <span className="text-sm text-muted-foreground">({groupInvoices.length})</span>
                      </div>
                      <span className="font-mono text-sm font-medium">
                        {groupInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0).toLocaleString('en-US', { 
                          style: 'currency', 
                          currency: groupInvoices[0].currency 
                        })}
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 pl-4 sm:pl-8">
                      {groupInvoices.map((invoice) => (
                        <InvoiceCard key={invoice.id} invoice={invoice} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
