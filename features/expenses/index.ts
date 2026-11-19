// Client-safe public API. Server-only record access lives in ./server.
export { formatYen, parseExpense, type ExpenseInput } from "./validate";
export type { Expense } from "./store";
export {
  categoryLabel,
  EXPENSE_CATEGORIES,
  filterExpenses,
  parseCategory,
  type ExpenseCategory,
} from "./categories";
