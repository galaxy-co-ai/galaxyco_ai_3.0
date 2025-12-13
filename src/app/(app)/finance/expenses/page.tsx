import { Metadata } from "next";
import { ExpenseList } from "@/components/finance-hq/expenses";
import { PageTitle } from "@/components/ui/page-title";
import { Receipt } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Expenses | Finance HQ | GalaxyCo.ai",
  description: "Track, approve, and manage business expenses",
};

export default function ExpensesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/finance">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Finance HQ
            </Link>
          </Button>
          <PageTitle
            title="Expense Management"
            icon={Receipt}
            iconClassName="text-rose-600"
          />
        </div>
      </div>
      
      <ExpenseList />
    </div>
  );
}
