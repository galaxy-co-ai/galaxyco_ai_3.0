"use client";

import * as React from "react";
import {
  Copy,
  Check,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type {
  FinanceObject,
  FinanceProvider,
  FinanceTransaction,
  FinanceEvent,
  FinanceModule,
  Invoice,
} from "@/types/finance";

/**
 * Get badge colors for each source
 */
function getSourceBadgeClass(source: FinanceProvider): string {
  const classes = {
    quickbooks: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    stripe: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
    shopify: "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900/20 dark:text-lime-400 dark:border-lime-800",
  };
  return classes[source];
}

/**
 * Source badge component
 */
function SourceBadge({ source }: { source: FinanceProvider }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs border capitalize", getSourceBadgeClass(source))}
    >
      {source}
    </Badge>
  );
}

/**
 * Get title for the drawer based on item type
 */
function getItemTitle(item: FinanceObject): string {
  switch (item.type) {
    case "transaction":
      return (item.data as unknown as FinanceTransaction).description || "Transaction";
    case "event":
      return (item.data as unknown as FinanceEvent).label || "Event";
    case "module":
      return (item.data as unknown as FinanceModule).title || "Module";
    case "invoice":
      return `Invoice #${(item.data as unknown as Invoice).invoiceNumber}`;
    default:
      return "Details";
  }
}

/**
 * Format currency amount
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format date to display string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Detail row component
 */
function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-between items-center py-2", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

/**
 * Transaction detail content
 */
function TransactionDetail({ data }: { data: FinanceTransaction }) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-muted/50">
        <p className="text-2xl font-bold text-foreground">
          {formatAmount(data.amount)}
        </p>
        <p className="text-sm text-muted-foreground capitalize">{data.type}</p>
      </div>
      <Separator />
      <DetailRow label="Date" value={formatDate(data.date)} />
      <DetailRow label="Source" value={<SourceBadge source={data.source} />} />
      <DetailRow label="Type" value={<span className="capitalize">{data.type}</span>} />
      {data.status && (
        <DetailRow
          label="Status"
          value={<span className="capitalize">{data.status}</span>}
        />
      )}
      <DetailRow label="Currency" value={data.currency.toUpperCase()} />
      <Separator />
      <div>
        <p className="text-sm text-muted-foreground mb-1">Description</p>
        <p className="text-sm text-foreground">{data.description}</p>
      </div>
      {data.externalId && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">External ID</p>
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {data.externalId}
          </code>
        </div>
      )}
    </div>
  );
}

/**
 * Event detail content
 */
function EventDetail({ data }: { data: FinanceEvent }) {
  return (
    <div className="space-y-4">
      {data.amount !== undefined && (
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-2xl font-bold text-foreground">
            {formatAmount(data.amount)}
          </p>
          <p className="text-sm text-muted-foreground capitalize">{data.type.replace("_", " ")}</p>
        </div>
      )}
      <Separator />
      <DetailRow label="Date" value={formatDate(data.date)} />
      <DetailRow label="Source" value={<SourceBadge source={data.source} />} />
      <DetailRow
        label="Type"
        value={<span className="capitalize">{data.type.replace("_", " ")}</span>}
      />
      {data.description && (
        <>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground">{data.description}</p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Module detail content
 */
function ModuleDetail({ data }: { data: FinanceModule }) {
  return (
    <div className="space-y-4">
      <DetailRow label="Source" value={<SourceBadge source={data.source} />} />
      <DetailRow label="Type" value={<span className="capitalize">{data.type}</span>} />
      <DetailRow
        label="Last Updated"
        value={formatDate(data.lastUpdated)}
      />
      <Separator />
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          View the full {data.title.toLowerCase()} in {data.source}.
        </p>
      </div>
    </div>
  );
}

/**
 * Invoice detail content
 */
function InvoiceDetail({ data }: { data: Invoice }) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-muted/50">
        <p className="text-2xl font-bold text-foreground">
          {formatAmount(data.total)}
        </p>
        <p className="text-sm text-muted-foreground">
          Balance: {formatAmount(data.balance)}
        </p>
      </div>
      <Separator />
      <DetailRow
        label="Status"
        value={
          <Badge
            variant={data.status === "paid" ? "default" : "secondary"}
            className="capitalize"
          >
            {data.status}
          </Badge>
        }
      />
      <DetailRow label="Invoice Number" value={data.invoiceNumber} />
      <DetailRow label="Customer" value={data.customer.name} />
      {data.customer.email && (
        <DetailRow label="Email" value={data.customer.email} />
      )}
      <DetailRow label="Due Date" value={formatDate(data.dueDate)} />
      {data.lineItems.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Line Items</p>
            <div className="space-y-2">
              {data.lineItems.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm p-2 rounded bg-muted/30"
                >
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.quantity} × {formatAmount(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-mono">{formatAmount(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Render detail content based on item type
 */
function DetailContent({ item }: { item: FinanceObject }) {
  switch (item.type) {
    case "transaction":
      return <TransactionDetail data={item.data as unknown as FinanceTransaction} />;
    case "event":
      return <EventDetail data={item.data as unknown as FinanceEvent} />;
    case "module":
      return <ModuleDetail data={item.data as unknown as FinanceModule} />;
    case "invoice":
      return <InvoiceDetail data={item.data as unknown as Invoice} />;
    default:
      return <p className="text-muted-foreground">No details available.</p>;
  }
}

/**
 * Action buttons based on item type
 */
function DetailActions({
  item,
  onClose,
}: {
  item: FinanceObject;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyId}
        className="flex-1"
        aria-label={copied ? "ID copied" : "Copy ID to clipboard"}
      >
        {copied ? (
          <Check className="h-4 w-4 mr-2" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
        )}
        {copied ? "Copied!" : "Copy ID"}
      </Button>
      <Button variant="default" size="sm" onClick={onClose} className="flex-1">
        Close
      </Button>
    </>
  );
}

interface FinanceDetailDrawerProps {
  item: FinanceObject | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Side panel drawer for viewing financial item details.
 * Adapts content based on item type (transaction, event, module, invoice).
 */
export function FinanceDetailDrawer({
  item,
  isOpen,
  onClose,
}: FinanceDetailDrawerProps) {
  const source = item?.data?.source as FinanceProvider | undefined;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full sm:w-[480px] sm:max-w-[480px] p-0 flex flex-col"
        aria-describedby="finance-drawer-description"
      >
        {item && (
          <>
            <SheetHeader className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between gap-4">
                <SheetTitle className="text-lg font-semibold truncate">
                  {getItemTitle(item)}
                </SheetTitle>
                {source && <SourceBadge source={source} />}
              </div>
              <SheetDescription id="finance-drawer-description" className="sr-only">
                Details for {getItemTitle(item)}
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="px-6 py-4">
                <DetailContent item={item} />
              </div>
            </ScrollArea>

            <div className="px-6 py-4 border-t border-border flex gap-3 mt-auto">
              <DetailActions item={item} onClose={onClose} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

