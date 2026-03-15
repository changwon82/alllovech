"use client";

import BudgetToolbar from "./BudgetToolbar";
import BudgetTable from "./BudgetTable";
import type { Budget } from "./BudgetTable";

export default function BudgetClientWrapper({
  budgets,
  yearFilter,
  committeeFilter,
  accountFilter,
  years,
  committees,
  accounts,
}: {
  budgets: Budget[];
  yearFilter: string;
  committeeFilter: string;
  accountFilter: string;
  years: string[];
  committees: string[];
  accounts: string[];
}) {
  return (
    <>
      <BudgetToolbar
        yearFilter={yearFilter}
        committeeFilter={committeeFilter}
        accountFilter={accountFilter}
        years={years}
        committees={committees}
        accounts={accounts}
        budgetCount={budgets.length}
      />

      <BudgetTable budgets={budgets} />
    </>
  );
}
