"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import toast from "react-hot-toast";
import { Plus, Trash2, Receipt, TrendingDown, Filter } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORIES = [
  "Food & Supplies",
  "Utilities",
  "Salaries",
  "Maintenance",
  "Marketing",
  "Equipment",
  "Cleaning",
  "Rent",
  "Insurance",
  "Other",
];

const schema = z.object({
  description: z.string().min(2),
  amount: z.number().min(0.01),
  category: z.string(),
  date: z.string(),
});

type FormData = z.infer<typeof schema>;

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
}

export function ExpensesClient({ businessId, initialExpenses }: { businessId: string; initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), "yyyy-MM"));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      category: "Other",
    },
  });

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const monthMatch = format(new Date(e.date), "yyyy-MM") === filterMonth;
      const catMatch = filterCategory === "all" || e.category === filterCategory;
      return monthMatch && catMatch;
    });
  }, [expenses, filterMonth, filterCategory]);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.split(" ")[0], value }));
  }, [filtered]);

  const onSubmit = async (data: FormData) => {
    setLoading("create");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: data.description, amount: data.amount, category: data.category, date: data.date, businessId }),
      });
      const json = await res.json();
      if (res.ok) {
        setExpenses((prev) => [json, ...prev]);
        setShowModal(false);
        reset();
        toast.success("Expense added");
      } else {
        toast.error(json.error ?? "Failed to add expense");
      }
    } catch {
      toast.error("Failed to add expense");
    } finally {
      setLoading(null);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    setLoading(`delete-${id}`);
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setLoading(null);
    }
  };

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMM yyyy") };
  });

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-danger-500" />
            <span className="text-xs text-gray-500">This Month</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">₹{totalAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{filtered.length} expenses</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Highest Category</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {chartData[0]?.name ?? "—"}
          </p>
          <p className="text-xs text-gray-400">₹{(chartData[0]?.value ?? 0).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Avg per Expense</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            ₹{filtered.length > 0 ? (totalAmount / filtered.length).toFixed(0) : 0}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
              <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="input text-sm py-1.5 w-36"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input text-sm py-1.5 w-44"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="ml-auto">
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No expenses for this period.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((expense) => (
              <div key={expense.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{expense.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">{expense.category}</span>
                    <span className="text-xs text-gray-400">{format(new Date(expense.date), "dd MMM yyyy")}</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-danger-600 dark:text-danger-400 shrink-0">
                  -₹{expense.amount.toLocaleString()}
                </span>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  disabled={loading === `delete-${expense.id}`}
                  className="text-gray-400 hover:text-danger-500 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset(); }} title="Add Expense">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Description *</label>
            <input {...register("description")} className="input" placeholder="e.g., Vegetable purchase" />
            {errors.description && <p className="text-danger-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
              <input {...register("amount", { valueAsNumber: true })} type="number" step="0.01" min="0" className="input" />
              {errors.amount && <p className="text-danger-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="label">Date *</label>
              <input {...register("date")} type="date" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Category *</label>
            <select {...register("category")} className="input">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button type="submit" disabled={loading === "create"} className="btn-primary flex-1 text-sm">
              {loading === "create" ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
