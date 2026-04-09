import { useState, useEffect } from "react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Wallet, TrendingUp, TrendingDown, PiggyBank, CreditCard,
    ShoppingCart, Home, Car, Utensils, Smartphone, Heart,
    GraduationCap, ArrowUpRight, ArrowDownRight, Plus, X,
    ChevronLeft, ChevronRight, Pencil, Trash2, AlertTriangle,
    Target, Briefcase, Repeat
} from "lucide-react";

const API_URL = "http://localhost:8000";

// ─── Category config ──────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
    { id: "vivienda",     label: "Vivienda",      Icon: Home,          color: "bg-blue-500",   textColor: "text-blue-600" },
    { id: "transporte",   label: "Transporte",     Icon: Car,           color: "bg-purple-500", textColor: "text-purple-600" },
    { id: "alimentacion", label: "Alimentación",   Icon: Utensils,      color: "bg-green-500",  textColor: "text-green-600" },
    { id: "tecnologia",   label: "Tecnología",     Icon: Smartphone,    color: "bg-orange-500", textColor: "text-orange-600" },
    { id: "salud",        label: "Salud",          Icon: Heart,         color: "bg-red-500",    textColor: "text-red-600" },
    { id: "educacion",    label: "Educación",      Icon: GraduationCap, color: "bg-yellow-500", textColor: "text-yellow-600" },
    { id: "compras",      label: "Compras",        Icon: ShoppingCart,  color: "bg-pink-500",   textColor: "text-pink-600" },
    { id: "otro",         label: "Otro",           Icon: CreditCard,    color: "bg-gray-500",   textColor: "text-gray-600" },
];

const INCOME_CATEGORIES = [
    { id: "nomina",    label: "Nómina" },
    { id: "freelance", label: "Freelance" },
    { id: "alquiler",  label: "Alquiler" },
    { id: "pension",   label: "Pensión" },
    { id: "otro",      label: "Otro" },
];

const INCOME_CATEGORY_COLORS: Record<string, string> = {
    nomina:    "bg-blue-100 text-blue-800",
    freelance: "bg-purple-100 text-purple-800",
    alquiler:  "bg-green-100 text-green-800",
    pension:   "bg-orange-100 text-orange-800",
    otro:      "bg-gray-100 text-gray-800",
};

const FREQUENCIES = [
    { id: "mensual",  label: "Mensual" },
    { id: "semanal",  label: "Semanal" },
    { id: "anual",    label: "Anual" },
    { id: "puntual",  label: "Puntual (una vez)" },
];

const FREQ_TO_MONTHLY: Record<string, number> = {
    mensual:  1,
    semanal:  4.33,
    anual:    1 / 12,
    puntual:  1 / 12,
};

const GOAL_COLORS = [
    { id: "bg-blue-500",   label: "Azul" },
    { id: "bg-green-500",  label: "Verde" },
    { id: "bg-purple-500", label: "Morado" },
    { id: "bg-orange-500", label: "Naranja" },
    { id: "bg-red-500",    label: "Rojo" },
    { id: "bg-yellow-500", label: "Amarillo" },
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Transaction {
    id: number;
    id_user: number;
    description: string;
    amount: number;
    type: "ingreso" | "gasto";
    category: string | null;
    date: string;
    notes: string | null;
    created_at: string;
    recurring_id: number | null;
}

interface RecurringTransaction {
    id: number;
    id_user: number;
    description: string;
    amount: number;
    type: "ingreso" | "gasto";
    category: string | null;
    day_of_month: number;
    notes: string | null;
    is_active: boolean;
    created_at: string;
}

interface IncomeSource {
    id: number;
    id_user: number;
    name: string;
    category: string;
    amount: number;
    frequency: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

interface SavingsGoal {
    id: number;
    id_user: number;
    name: string;
    target_amount: number;
    current_amount: number;
    color: string | null;
    deadline: string | null;
    created_at: string;
}

interface ExpenseBudget {
    id: number;
    id_user: number;
    category: string;
    budget: number;
}

interface FinanceSummary {
    total_ingresos: number;
    total_gastos: number;
    balance: number;
    projected_monthly_income: number;
    savings_rate: number;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

const formatMonth = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
};

const prevMonthStr = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const nextMonthStr = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

// ─── Component ────────────────────────────────────────────────────────────────

export const FinancePage = () => {
    // ── Server state ──────────────────────────────────────────────────────────
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
    const [budgets, setBudgets] = useState<ExpenseBudget[]>([]);
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Navigation ────────────────────────────────────────────────────────────
    const [selectedMonth, setSelectedMonth] = useState<string>(
        () => new Date().toISOString().slice(0, 7)
    );
    const [activeTab, setActiveTab] = useState("resumen");

    // ── Transaction modal ─────────────────────────────────────────────────────
    const [txModal, setTxModal] = useState<{ open: boolean; editing: Transaction | null }>({ open: false, editing: null });
    const [txDesc, setTxDesc] = useState("");
    const [txAmount, setTxAmount] = useState("");
    const [txType, setTxType] = useState<"ingreso" | "gasto">("gasto");
    const [txCategory, setTxCategory] = useState("");
    const [txDate, setTxDate] = useState(todayISO());
    const [txNotes, setTxNotes] = useState("");
    const [txIsRecurring, setTxIsRecurring] = useState(false);
    const [txRecurringDay, setTxRecurringDay] = useState("1");
    const [txSaving, setTxSaving] = useState(false);

    // ── Income source modal ───────────────────────────────────────────────────
    const [incModal, setIncModal] = useState<{ open: boolean; editing: IncomeSource | null }>({ open: false, editing: null });
    const [incName, setIncName] = useState("");
    const [incCategory, setIncCategory] = useState("nomina");
    const [incAmount, setIncAmount] = useState("");
    const [incFrequency, setIncFrequency] = useState("mensual");
    const [incDescription, setIncDescription] = useState("");
    const [incActive, setIncActive] = useState(true);
    const [incSaving, setIncSaving] = useState(false);

    // ── Savings goal modal ────────────────────────────────────────────────────
    const [goalModal, setGoalModal] = useState<{ open: boolean; editing: SavingsGoal | null }>({ open: false, editing: null });
    const [goalName, setGoalName] = useState("");
    const [goalTarget, setGoalTarget] = useState("");
    const [goalCurrent, setGoalCurrent] = useState("0");
    const [goalColor, setGoalColor] = useState("bg-blue-500");
    const [goalDeadline, setGoalDeadline] = useState("");
    const [goalSaving, setGoalSaving] = useState(false);

    // ── Contribution modal ────────────────────────────────────────────────────
    const [contributionGoal, setContributionGoal] = useState<SavingsGoal | null>(null);
    const [contributionAmount, setContributionAmount] = useState("");
    const [contributionSaving, setContributionSaving] = useState(false);

    // ── Budget inline edit ────────────────────────────────────────────────────
    const [editingBudgetCat, setEditingBudgetCat] = useState<string | null>(null);
    const [editingBudgetVal, setEditingBudgetVal] = useState("");

    // ── Quick-add row ─────────────────────────────────────────────────────────
    const [qaDesc, setQaDesc] = useState("");
    const [qaAmount, setQaAmount] = useState("");
    const [qaCategory, setQaCategory] = useState("alimentacion");
    const [qaAdding, setQaAdding] = useState(false);

    // ── Auth ──────────────────────────────────────────────────────────────────
    const getAuthHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    });

    // ── Fetch all data ────────────────────────────────────────────────────────
    const fetchAll = async () => {
        setLoading(true);
        try {
            const [txRes, incRes, goalRes, budgetRes, sumRes, recRes] = await Promise.all([
                fetch(`${API_URL}/finance/transactions?month=${selectedMonth}`, { headers: getAuthHeaders() }),
                fetch(`${API_URL}/finance/income-sources`, { headers: getAuthHeaders() }),
                fetch(`${API_URL}/finance/savings-goals`, { headers: getAuthHeaders() }),
                fetch(`${API_URL}/finance/budgets`, { headers: getAuthHeaders() }),
                fetch(`${API_URL}/finance/summary?month=${selectedMonth}`, { headers: getAuthHeaders() }),
                fetch(`${API_URL}/finance/recurring`, { headers: getAuthHeaders() }),
            ]);
            if (txRes.ok) setTransactions(await txRes.json());
            if (incRes.ok) setIncomeSources(await incRes.json());
            if (goalRes.ok) setSavingsGoals(await goalRes.json());
            if (budgetRes.ok) setBudgets(await budgetRes.json());
            if (sumRes.ok) setSummary(await sumRes.json());
            if (recRes.ok) setRecurringTransactions(await recRes.json());
        } catch (err) {
            console.error("Error fetching finance data:", err);
        } finally {
            setLoading(false);
        }
    };

    const refreshSummary = async () => {
        const res = await fetch(`${API_URL}/finance/summary?month=${selectedMonth}`, { headers: getAuthHeaders() });
        if (res.ok) setSummary(await res.json());
    };

    useEffect(() => { fetchAll(); }, [selectedMonth]);

    // ── Transaction CRUD ──────────────────────────────────────────────────────

    const openCreateTx = () => {
        setTxDesc(""); setTxAmount(""); setTxType("gasto"); setTxCategory("");
        setTxDate(todayISO()); setTxNotes("");
        setTxIsRecurring(false); setTxRecurringDay("1");
        setTxModal({ open: true, editing: null });
    };

    const openEditTx = (t: Transaction) => {
        setTxDesc(t.description); setTxAmount(String(t.amount));
        setTxType(t.type); setTxCategory(t.category || "");
        setTxDate(t.date); setTxNotes(t.notes || "");
        setTxIsRecurring(false); setTxRecurringDay("1");
        setTxModal({ open: true, editing: t });
    };

    const handleSaveTx = async () => {
        const amount = parseFloat(txAmount);
        setTxSaving(true);
        try {
            // Creating a new recurring template
            if (!txModal.editing && txIsRecurring) {
                const day = parseInt(txRecurringDay);
                if (!txDesc.trim() || isNaN(amount) || amount <= 0 || isNaN(day) || day < 1 || day > 28) return;
                const res = await fetch(`${API_URL}/finance/recurring`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ description: txDesc.trim(), amount, type: txType, category: txCategory || null, day_of_month: day, notes: txNotes.trim() || null }),
                });
                if (res.ok) {
                    await fetchAll(); // reload all: recurring list + materialized transaction
                    setTxModal({ open: false, editing: null });
                }
                return;
            }
            // Regular transaction (create or edit)
            if (!txDesc.trim() || isNaN(amount) || amount <= 0 || !txDate) return;
            const body = { description: txDesc.trim(), amount, type: txType, category: txCategory || null, date: txDate, notes: txNotes.trim() || null };
            const editing = txModal.editing;
            const res = editing
                ? await fetch(`${API_URL}/finance/transactions/${editing.id}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(body) })
                : await fetch(`${API_URL}/finance/transactions`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(body) });
            if (res.ok) {
                const saved: Transaction = await res.json();
                if (editing) {
                    setTransactions(prev => prev.map(t => t.id === saved.id ? saved : t));
                } else {
                    setTransactions(prev => [saved, ...prev]);
                }
                await refreshSummary();
                setTxModal({ open: false, editing: null });
            }
        } finally {
            setTxSaving(false);
        }
    };

    const handleDeleteTx = async (id: number) => {
        const res = await fetch(`${API_URL}/finance/transactions/${id}`, { method: "DELETE", headers: getAuthHeaders() });
        if (res.ok) {
            setTransactions(prev => prev.filter(t => t.id !== id));
            await refreshSummary();
        }
    };

    const handleDeleteRecurring = async (id: number) => {
        const res = await fetch(`${API_URL}/finance/recurring/${id}`, { method: "DELETE", headers: getAuthHeaders() });
        if (res.ok) setRecurringTransactions(prev => prev.filter(r => r.id !== id));
    };

    const handleToggleRecurring = async (r: RecurringTransaction) => {
        const res = await fetch(`${API_URL}/finance/recurring/${r.id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ is_active: !r.is_active }),
        });
        if (res.ok) {
            const saved: RecurringTransaction = await res.json();
            setRecurringTransactions(prev => prev.map(x => x.id === saved.id ? saved : x));
        }
    };

    const handleQuickAdd = async () => {
        const amount = parseFloat(qaAmount);
        if (!qaDesc.trim() || isNaN(amount) || amount <= 0) return;
        setQaAdding(true);
        try {
            const res = await fetch(`${API_URL}/finance/transactions`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ description: qaDesc.trim(), amount, type: "gasto", category: qaCategory, date: todayISO(), notes: null }),
            });
            if (res.ok) {
                const saved: Transaction = await res.json();
                setTransactions(prev => [saved, ...prev]);
                setQaDesc(""); setQaAmount("");
                await refreshSummary();
            }
        } finally {
            setQaAdding(false);
        }
    };

    // ── Income source CRUD ────────────────────────────────────────────────────

    const openCreateInc = () => {
        setIncName(""); setIncCategory("nomina"); setIncAmount("");
        setIncFrequency("mensual"); setIncDescription(""); setIncActive(true);
        setIncModal({ open: true, editing: null });
    };

    const openEditInc = (s: IncomeSource) => {
        setIncName(s.name); setIncCategory(s.category); setIncAmount(String(s.amount));
        setIncFrequency(s.frequency); setIncDescription(s.description || ""); setIncActive(s.is_active);
        setIncModal({ open: true, editing: s });
    };

    const handleSaveInc = async () => {
        const amount = parseFloat(incAmount);
        if (!incName.trim() || isNaN(amount) || amount <= 0) return;
        setIncSaving(true);
        try {
            const body = { name: incName.trim(), category: incCategory, amount, frequency: incFrequency, description: incDescription.trim() || null, is_active: incActive };
            const editing = incModal.editing;
            const res = editing
                ? await fetch(`${API_URL}/finance/income-sources/${editing.id}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(body) })
                : await fetch(`${API_URL}/finance/income-sources`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(body) });
            if (res.ok) {
                const saved: IncomeSource = await res.json();
                if (editing) {
                    setIncomeSources(prev => prev.map(s => s.id === saved.id ? saved : s));
                } else {
                    setIncomeSources(prev => [...prev, saved]);
                }
                await refreshSummary();
                setIncModal({ open: false, editing: null });
            }
        } finally {
            setIncSaving(false);
        }
    };

    const handleDeleteInc = async (id: number) => {
        const res = await fetch(`${API_URL}/finance/income-sources/${id}`, { method: "DELETE", headers: getAuthHeaders() });
        if (res.ok) {
            setIncomeSources(prev => prev.filter(s => s.id !== id));
            await refreshSummary();
        }
    };

    const handleToggleActive = async (s: IncomeSource) => {
        const res = await fetch(`${API_URL}/finance/income-sources/${s.id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ is_active: !s.is_active }),
        });
        if (res.ok) {
            const saved: IncomeSource = await res.json();
            setIncomeSources(prev => prev.map(x => x.id === saved.id ? saved : x));
            await refreshSummary();
        }
    };

    // ── Savings goal CRUD ─────────────────────────────────────────────────────

    const openCreateGoal = () => {
        setGoalName(""); setGoalTarget(""); setGoalCurrent("0");
        setGoalColor("bg-blue-500"); setGoalDeadline("");
        setGoalModal({ open: true, editing: null });
    };

    const openEditGoal = (g: SavingsGoal) => {
        setGoalName(g.name); setGoalTarget(String(g.target_amount));
        setGoalCurrent(String(g.current_amount)); setGoalColor(g.color || "bg-blue-500");
        setGoalDeadline(g.deadline || "");
        setGoalModal({ open: true, editing: g });
    };

    const handleSaveGoal = async () => {
        const target = parseFloat(goalTarget);
        if (!goalName.trim() || isNaN(target) || target <= 0) return;
        setGoalSaving(true);
        try {
            const body = { name: goalName.trim(), target_amount: target, current_amount: parseFloat(goalCurrent) || 0, color: goalColor, deadline: goalDeadline || null };
            const editing = goalModal.editing;
            const res = editing
                ? await fetch(`${API_URL}/finance/savings-goals/${editing.id}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(body) })
                : await fetch(`${API_URL}/finance/savings-goals`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(body) });
            if (res.ok) {
                const saved: SavingsGoal = await res.json();
                if (editing) {
                    setSavingsGoals(prev => prev.map(g => g.id === saved.id ? saved : g));
                } else {
                    setSavingsGoals(prev => [...prev, saved]);
                }
                setGoalModal({ open: false, editing: null });
            }
        } finally {
            setGoalSaving(false);
        }
    };

    const handleDeleteGoal = async (id: number) => {
        const res = await fetch(`${API_URL}/finance/savings-goals/${id}`, { method: "DELETE", headers: getAuthHeaders() });
        if (res.ok) setSavingsGoals(prev => prev.filter(g => g.id !== id));
    };

    const handleContribute = async () => {
        if (!contributionGoal) return;
        const amount = parseFloat(contributionAmount);
        if (isNaN(amount) || amount <= 0) return;
        setContributionSaving(true);
        try {
            const res = await fetch(`${API_URL}/finance/savings-goals/${contributionGoal.id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ current_amount: contributionGoal.current_amount + amount }),
            });
            if (res.ok) {
                const saved: SavingsGoal = await res.json();
                setSavingsGoals(prev => prev.map(g => g.id === saved.id ? saved : g));
                setContributionGoal(null);
                setContributionAmount("");
            }
        } finally {
            setContributionSaving(false);
        }
    };

    // ── Budget upsert ─────────────────────────────────────────────────────────

    const handleSaveBudget = async (category: string) => {
        const budget = parseFloat(editingBudgetVal);
        if (isNaN(budget) || budget <= 0) return;
        const res = await fetch(`${API_URL}/finance/budgets/${category}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ category, budget }),
        });
        if (res.ok) {
            const saved: ExpenseBudget = await res.json();
            setBudgets(prev =>
                prev.find(b => b.category === category)
                    ? prev.map(b => b.category === category ? saved : b)
                    : [...prev, saved]
            );
            setEditingBudgetCat(null);
        }
    };

    // ── Computed values ───────────────────────────────────────────────────────

    const gastoTransactions = transactions.filter(t => t.type === "gasto");
    const ingresoTransactions = transactions.filter(t => t.type === "ingreso");

    const spendingByCategory: Record<string, number> = {};
    gastoTransactions.forEach(t => {
        const cat = t.category || "otro";
        spendingByCategory[cat] = (spendingByCategory[cat] || 0) + t.amount;
    });

    const getBudget = (category: string) => budgets.find(b => b.category === category)?.budget ?? null;

    const displayExpenseCategories = [
        ...EXPENSE_CATEGORIES.filter(c => spendingByCategory[c.id] !== undefined || getBudget(c.id) !== null),
        ...EXPENSE_CATEGORIES.filter(c => spendingByCategory[c.id] === undefined && getBudget(c.id) === null),
    ].slice(0, 8);

    const monthlyBySource = (s: IncomeSource) => s.amount * (FREQ_TO_MONTHLY[s.frequency] || 1);
    const activeIncomeSources = incomeSources.filter(s => s.is_active);
    const totalProjectedMonthly = activeIncomeSources.reduce((acc, s) => acc + monthlyBySource(s), 0);
    const totalProjectedAnnual = totalProjectedMonthly * 12;

    const incomeByCategory: Record<string, number> = {};
    activeIncomeSources.forEach(s => {
        incomeByCategory[s.category] = (incomeByCategory[s.category] || 0) + monthlyBySource(s);
    });

    const overBudgetCategories = EXPENSE_CATEGORIES.filter(c => {
        const budget = getBudget(c.id);
        const spent = spendingByCategory[c.id] || 0;
        return budget !== null && spent > 0 && spent / budget > 0.9;
    });

    const totalSaved = savingsGoals.reduce((acc, g) => acc + g.current_amount, 0);

    const monthsToDeadline = (deadline: string | null): number | null => {
        if (!deadline) return null;
        const today = new Date();
        const d = new Date(deadline + "T00:00:00");
        const months = (d.getFullYear() - today.getFullYear()) * 12 + (d.getMonth() - today.getMonth());
        return months > 0 ? months : null;
    };

    const monthlyNeeded = (g: SavingsGoal): number | null => {
        const months = monthsToDeadline(g.deadline);
        if (!months) return null;
        const remaining = g.target_amount - g.current_amount;
        if (remaining <= 0) return null;
        return remaining / months;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // JSX
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Finanzas</h1>
                        <p className="text-muted-foreground">Gestiona tus ingresos, gastos y ahorros</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 border rounded-lg px-2 py-1">
                        <button onClick={() => setSelectedMonth(prevMonthStr(selectedMonth))} className="p-1 rounded hover:bg-muted transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium px-2 w-32 text-center capitalize">
                            {formatMonth(selectedMonth)}
                        </span>
                        <button onClick={() => setSelectedMonth(nextMonthStr(selectedMonth))} className="p-1 rounded hover:bg-muted transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateTx}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Transacción
                    </Button>
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Balance del Mes</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${(summary?.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {loading ? "—" : formatCurrency(summary?.balance ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Ingresos menos gastos del mes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {loading ? "—" : formatCurrency(summary?.total_ingresos ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Tasa de ahorro: {summary && summary.total_ingresos > 0 ? `${summary.savings_rate.toFixed(0)}%` : "—"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {loading ? "—" : formatCurrency(summary?.total_gastos ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">{gastoTransactions.length} transacciones</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Proyectados</CardTitle>
                        <Briefcase className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {loading ? "—" : formatCurrency(summary?.projected_monthly_income ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Proyección mensual de fuentes activas</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Budget Alert Banner ── */}
            {overBudgetCategories.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                        <strong>Alerta de presupuesto:</strong>{" "}
                        {overBudgetCategories.map(c => c.label).join(", ")} superan el 90% del presupuesto.{" "}
                        <button className="underline" onClick={() => setActiveTab("gastos")}>Ver gastos</button>
                    </span>
                </div>
            )}

            {/* ── Tabs ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="resumen">Resumen</TabsTrigger>
                    <TabsTrigger value="gastos">Gastos</TabsTrigger>
                    <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
                    <TabsTrigger value="ahorros">Ahorros</TabsTrigger>
                </TabsList>

                {/* ════════════════════════════ RESUMEN ════════════════════════════ */}
                <TabsContent value="resumen" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Transacciones Recientes
                                </CardTitle>
                                <CardDescription>Últimos movimientos del mes</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {loading ? (
                                    <p className="text-sm text-muted-foreground py-2">Cargando...</p>
                                ) : transactions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">
                                        Sin transacciones este mes.{" "}
                                        <button className="text-primary underline" onClick={openCreateTx}>Añadir una</button>
                                    </p>
                                ) : (
                                    transactions.slice(0, 5).map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${t.type === "ingreso" ? "bg-green-100" : "bg-red-100"}`}>
                                                    {t.type === "ingreso"
                                                        ? <ArrowUpRight className="h-4 w-4 text-green-600" />
                                                        : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-medium text-sm">{t.description}</p>
                                                        {t.recurring_id && <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(t.date + "T00:00:00").toLocaleDateString("es-ES")}
                                                        {t.category && ` · ${EXPENSE_CATEGORIES.find(c => c.id === t.category)?.label ?? t.category}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`font-semibold text-sm ${t.type === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                                                {t.type === "ingreso" ? "+" : "-"}{formatCurrency(t.amount)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PiggyBank className="h-5 w-5" />
                                    Metas de Ahorro
                                </CardTitle>
                                <CardDescription>Progreso hacia tus objetivos</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {loading ? (
                                    <p className="text-sm text-muted-foreground py-2">Cargando...</p>
                                ) : savingsGoals.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">
                                        Sin metas de ahorro.{" "}
                                        <button className="text-primary underline" onClick={() => setActiveTab("ahorros")}>Crear una</button>
                                    </p>
                                ) : (
                                    savingsGoals.map(g => {
                                        const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
                                        return (
                                            <div key={g.id} className="space-y-1.5">
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${g.color || "bg-blue-500"}`} />
                                                        <span className="font-medium">{g.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground text-xs">
                                                            {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                                                            onClick={() => { setContributionGoal(g); setContributionAmount(""); }}
                                                        >
                                                            Aportar
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Progress value={pct} className="h-2" />
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ════════════════════════════ GASTOS ════════════════════════════ */}
                <TabsContent value="gastos" className="space-y-4">
                    {/* Quick-add row */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Registro rápido</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    placeholder="Descripción (ej: Carrefour)"
                                    value={qaDesc}
                                    onChange={e => setQaDesc(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Importe €"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={qaAmount}
                                    onChange={e => setQaAmount(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
                                    className="w-32"
                                />
                                <select
                                    value={qaCategory}
                                    onChange={e => setQaCategory(e.target.value)}
                                    className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={handleQuickAdd}
                                    disabled={qaAdding || !qaDesc.trim() || !qaAmount}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    {qaAdding ? "..." : "Añadir"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Gastos por Categoría</CardTitle>
                            <CardDescription>Haz clic en el presupuesto para editarlo inline</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {displayExpenseCategories.map(c => {
                                    const spent = spendingByCategory[c.id] || 0;
                                    const budget = getBudget(c.id);
                                    const pct = budget ? Math.min((spent / budget) * 100, 100) : 0;
                                    const isOver90 = budget !== null && spent > 0 && spent / budget > 0.9;
                                    const isOver75 = budget !== null && spent > 0 && spent / budget > 0.75;
                                    const barColor = isOver90 ? "[&>div]:bg-red-500" : isOver75 ? "[&>div]:bg-yellow-500" : "";
                                    return (
                                        <div key={c.id} className={`p-4 rounded-lg border transition-shadow hover:shadow-md ${isOver90 ? "border-red-200 bg-red-50/30" : ""}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${c.color} bg-opacity-20`}>
                                                        <c.Icon className={`h-5 w-5 ${c.textColor}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{c.label}</p>
                                                        {editingBudgetCat === c.id ? (
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <input
                                                                    type="number"
                                                                    value={editingBudgetVal}
                                                                    onChange={e => setEditingBudgetVal(e.target.value)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === "Enter") handleSaveBudget(c.id);
                                                                        if (e.key === "Escape") setEditingBudgetCat(null);
                                                                    }}
                                                                    autoFocus
                                                                    className="w-24 rounded border border-input bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                                                    placeholder="Presupuesto €"
                                                                />
                                                                <button onClick={() => handleSaveBudget(c.id)} className="text-xs text-primary font-medium">✓</button>
                                                                <button onClick={() => setEditingBudgetCat(null)} className="text-xs text-muted-foreground">✕</button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setEditingBudgetCat(c.id); setEditingBudgetVal(budget !== null ? String(budget) : ""); }}
                                                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-0.5"
                                                            >
                                                                {budget !== null ? `Presup: ${formatCurrency(budget)}` : "Fijar presupuesto"}
                                                                <Pencil className="h-2.5 w-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`font-bold ${spent > 0 ? "" : "text-muted-foreground"}`}>
                                                    {formatCurrency(spent)}
                                                </span>
                                            </div>
                                            {budget !== null && (
                                                <>
                                                    <Progress value={pct} className={`h-2 ${barColor}`} />
                                                    <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% del presupuesto</p>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recurring expenses */}
                    {recurringTransactions.filter(r => r.type === "gasto").length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Repeat className="h-4 w-4" />
                                    Gastos Fijos
                                </CardTitle>
                                <CardDescription>Se generan automáticamente cada mes</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {recurringTransactions.filter(r => r.type === "gasto").map(r => (
                                    <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border transition-opacity ${!r.is_active ? "opacity-50" : ""}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-red-100">
                                                <Repeat className="h-3.5 w-3.5 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{r.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Día {r.day_of_month} de cada mes
                                                    {r.category && ` · ${EXPENSE_CATEGORIES.find(c => c.id === r.category)?.label ?? r.category}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-red-600">{formatCurrency(r.amount)}</span>
                                            <button
                                                onClick={() => handleToggleRecurring(r)}
                                                className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${r.is_active ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" : "border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                                            >
                                                {r.is_active ? "Activo" : "Inactivo"}
                                            </button>
                                            <button onClick={() => handleDeleteRecurring(r.id)} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Expense list */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Gastos</CardTitle>
                            <CardDescription>
                                {gastoTransactions.length} gastos · {formatCurrency(summary?.total_gastos ?? 0)} total
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {gastoTransactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">Sin gastos este mes.</p>
                            ) : (
                                <div className="space-y-2">
                                    {gastoTransactions.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-red-100">
                                                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-medium text-sm">{t.description}</p>
                                                        {t.recurring_id && <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(t.date + "T00:00:00").toLocaleDateString("es-ES")}
                                                        {t.category && ` · ${EXPENSE_CATEGORIES.find(c => c.id === t.category)?.label ?? t.category}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-red-600">{formatCurrency(t.amount)}</span>
                                                <button onClick={() => openEditTx(t)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                                                <button onClick={() => handleDeleteTx(t.id)} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ════════════════════════════ INGRESOS ════════════════════════════ */}
                <TabsContent value="ingresos" className="space-y-4">

                    {/* Recurring incomes */}
                    {recurringTransactions.filter(r => r.type === "ingreso").length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Repeat className="h-4 w-4" />
                                    Ingresos Fijos
                                </CardTitle>
                                <CardDescription>Nómina, alquiler u otros ingresos recurrentes</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {recurringTransactions.filter(r => r.type === "ingreso").map(r => (
                                    <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border transition-opacity ${!r.is_active ? "opacity-50" : ""}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-green-100">
                                                <Repeat className="h-3.5 w-3.5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{r.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Día {r.day_of_month} de cada mes
                                                    {r.category && ` · ${EXPENSE_CATEGORIES.find(c => c.id === r.category)?.label ?? r.category}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-green-600">{formatCurrency(r.amount)}</span>
                                            <button
                                                onClick={() => handleToggleRecurring(r)}
                                                className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${r.is_active ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" : "border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                                            >
                                                {r.is_active ? "Activo" : "Inactivo"}
                                            </button>
                                            <button onClick={() => handleDeleteRecurring(r.id)} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">Fuentes de Ingresos</h3>
                            <p className="text-sm text-muted-foreground">Define tus fuentes de ingresos periódicas</p>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateInc}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Fuente
                        </Button>
                    </div>

                    {incomeSources.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                <p className="font-medium mb-1">Sin fuentes de ingresos</p>
                                <p className="text-sm text-muted-foreground">Añade tu nómina, ingresos freelance u otras fuentes periódicas.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {incomeSources.map(s => (
                                <Card key={s.id} className={`transition-opacity ${!s.is_active ? "opacity-60" : ""}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold truncate">{s.name}</h4>
                                                    <Badge className={`text-xs shrink-0 border-0 ${INCOME_CATEGORY_COLORS[s.category] ?? "bg-gray-100 text-gray-800"}`}>
                                                        {INCOME_CATEGORIES.find(c => c.id === s.category)?.label ?? s.category}
                                                    </Badge>
                                                </div>
                                                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                                            </div>
                                            <div className="flex items-center gap-1 ml-2 shrink-0">
                                                <button
                                                    onClick={() => handleToggleActive(s)}
                                                    className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${s.is_active ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" : "border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                                                >
                                                    {s.is_active ? "Activo" : "Inactivo"}
                                                </button>
                                                <button onClick={() => openEditInc(s)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="h-4 w-4" /></button>
                                                <button onClick={() => handleDeleteInc(s.id)} className="text-muted-foreground hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-bold">{formatCurrency(s.amount)}</span>
                                            <div className="text-right">
                                                <span className="text-sm text-muted-foreground">{FREQUENCIES.find(f => f.id === s.frequency)?.label ?? s.frequency}</span>
                                                {s.frequency !== "mensual" && (
                                                    <p className="text-xs text-muted-foreground">≈ {formatCurrency(monthlyBySource(s))}/mes</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Projection panel */}
                    {incomeSources.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Proyección de Ingresos</CardTitle>
                                <CardDescription>Basada en tus fuentes activas</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 rounded-lg bg-primary/10">
                                        <p className="text-sm text-muted-foreground">Total mensual</p>
                                        <p className="text-2xl font-bold text-primary">{formatCurrency(totalProjectedMonthly)}</p>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-muted/50">
                                        <p className="text-sm text-muted-foreground">Total anual</p>
                                        <p className="text-2xl font-bold">{formatCurrency(totalProjectedAnnual)}</p>
                                    </div>
                                </div>
                                {totalProjectedMonthly > 0 && Object.keys(incomeByCategory).length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium">Distribución por categoría</p>
                                        {Object.entries(incomeByCategory).map(([cat, amount]) => {
                                            const pct = (amount / totalProjectedMonthly) * 100;
                                            return (
                                                <div key={cat} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span>{INCOME_CATEGORIES.find(c => c.id === cat)?.label ?? cat}</span>
                                                        <span className="text-muted-foreground">{formatCurrency(amount)} · {pct.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {ingresoTransactions.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Ingresos recibidos este mes</p>
                                        <div className="space-y-2">
                                            {ingresoTransactions.map(t => (
                                                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowUpRight className="h-4 w-4 text-green-600 shrink-0" />
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-sm font-medium">{t.description}</p>
                                                                {t.recurring_id && <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{new Date(t.date + "T00:00:00").toLocaleDateString("es-ES")}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-green-600">{formatCurrency(t.amount)}</span>
                                                        <button onClick={() => openEditTx(t)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                                                        <button onClick={() => handleDeleteTx(t.id)} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ════════════════════════════ AHORROS ════════════════════════════ */}
                <TabsContent value="ahorros" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">Metas de Ahorro</h3>
                            <p className="text-sm text-muted-foreground">Gestiona tus objetivos de ahorro</p>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateGoal}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Meta
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-4">
                            {savingsGoals.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center">
                                        <Target className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                        <p className="font-medium mb-1">Sin metas de ahorro</p>
                                        <p className="text-sm text-muted-foreground">Crea tu primer objetivo de ahorro.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                savingsGoals.map(g => {
                                    const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
                                    const remaining = g.target_amount - g.current_amount;
                                    const months = monthsToDeadline(g.deadline);
                                    const needed = monthlyNeeded(g);
                                    const completed = pct >= 100;
                                    return (
                                        <Card key={g.id} className={completed ? "border-green-300 bg-green-50/30" : ""}>
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${g.color || "bg-blue-500"}`} />
                                                        <h4 className="font-semibold">{g.name}</h4>
                                                        {completed && <Badge className="bg-green-100 text-green-800 border-0 text-xs">¡Completada!</Badge>}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Badge variant="outline">{pct.toFixed(0)}%</Badge>
                                                        <button onClick={() => openEditGoal(g)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="h-3.5 w-3.5" /></button>
                                                        <button onClick={() => handleDeleteGoal(g.id)} className="text-muted-foreground hover:text-red-600 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                                                    </div>
                                                </div>
                                                <Progress value={pct} className="h-3" />
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>Ahorrado: {formatCurrency(g.current_amount)}</span>
                                                    <span>Objetivo: {formatCurrency(g.target_amount)}</span>
                                                </div>
                                                {!completed && <p className="text-sm text-muted-foreground">Faltan {formatCurrency(remaining)} para completar</p>}
                                                {needed !== null && (
                                                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                                        <span>
                                                            {months} {months === 1 ? "mes" : "meses"} hasta el límite ·{" "}
                                                            Necesitas ahorrar <strong>{formatCurrency(needed)}/mes</strong>
                                                        </span>
                                                    </div>
                                                )}
                                                {g.deadline && monthsToDeadline(g.deadline) === null && !completed && (
                                                    <p className="text-xs text-red-500">Plazo vencido el {new Date(g.deadline + "T00:00:00").toLocaleDateString("es-ES")}</p>
                                                )}
                                                {!completed && (
                                                    <Button
                                                        size="sm"
                                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => { setContributionGoal(g); setContributionAmount(""); }}
                                                    >
                                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                                        Aportar
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>

                        <Card className="h-fit">
                            <CardHeader><CardTitle>Resumen de Ahorros</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center p-6 rounded-lg bg-primary/10">
                                    <PiggyBank className="h-12 w-12 mx-auto text-primary mb-2" />
                                    <p className="text-sm text-muted-foreground">Total Ahorrado</p>
                                    <p className="text-3xl font-bold">{formatCurrency(totalSaved)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 rounded-lg bg-muted/50">
                                        <p className="text-sm text-muted-foreground">Balance este mes</p>
                                        <p className={`text-xl font-bold ${(summary?.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {summary ? formatCurrency(summary.balance) : "—"}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-muted/50">
                                        <p className="text-sm text-muted-foreground">Tasa de Ahorro</p>
                                        <p className="text-xl font-bold">
                                            {summary && summary.total_ingresos > 0 ? `${summary.savings_rate.toFixed(0)}%` : "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm text-muted-foreground">Metas en progreso</p>
                                    <p className="text-xl font-bold">{savingsGoals.filter(g => g.current_amount < g.target_amount).length}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ══════════════════════════════ MODALS ══════════════════════════════ */}

            {/* Transaction create/edit */}
            {txModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setTxModal({ open: false, editing: null })}>
                    <div className="bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{txModal.editing ? "Editar Transacción" : "Nueva Transacción"}</h2>
                            <button onClick={() => setTxModal({ open: false, editing: null })} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                        </div>
                        <div>
                            <Label>Tipo</Label>
                            <div className="flex gap-2 mt-1.5">
                                {(["gasto", "ingreso"] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTxType(t)}
                                        className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${txType === t
                                            ? t === "gasto" ? "bg-red-500 text-white border-red-500" : "bg-green-500 text-white border-green-500"
                                            : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
                                    >
                                        {t === "gasto" ? "Gasto" : "Ingreso"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tx-desc">Descripción <span className="text-red-500">*</span></Label>
                            <Input id="tx-desc" value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="ej: Supermercado, Nómina..." autoFocus />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="tx-amount">Importe (€) <span className="text-red-500">*</span></Label>
                                <Input id="tx-amount" type="number" min="0" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="0.00" />
                            </div>
                            {(!txIsRecurring || txModal.editing) && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="tx-date">Fecha <span className="text-red-500">*</span></Label>
                                    <Input id="tx-date" type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tx-cat">Categoría</Label>
                            <select id="tx-cat" value={txCategory} onChange={e => setTxCategory(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                <option value="">Sin categoría</option>
                                {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tx-notes">Notas <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                            <textarea id="tx-notes" value={txNotes} onChange={e => setTxNotes(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                        </div>
                        {!txModal.editing && (
                            <div className="rounded-lg border border-dashed p-3 space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={txIsRecurring} onChange={e => setTxIsRecurring(e.target.checked)} className="rounded" />
                                    <Repeat className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Hacer recurrente</span>
                                </label>
                                {txIsRecurring && (
                                    <div className="space-y-1 pl-6">
                                        <Label htmlFor="tx-day" className="text-xs">Día del mes <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="tx-day"
                                            type="number"
                                            min="1"
                                            max="28"
                                            value={txRecurringDay}
                                            onChange={e => setTxRecurringDay(e.target.value)}
                                            className="w-24 h-8 text-sm"
                                            placeholder="1-28"
                                        />
                                        <p className="text-xs text-muted-foreground">Se generará automáticamente ese día cada mes.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setTxModal({ open: false, editing: null })}>Cancelar</Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={handleSaveTx}
                                disabled={
                                    !txDesc.trim() || !txAmount || parseFloat(txAmount) <= 0 || txSaving ||
                                    (txIsRecurring && !txModal.editing
                                        ? (parseInt(txRecurringDay) < 1 || parseInt(txRecurringDay) > 28)
                                        : !txDate)
                                }
                            >
                                {txSaving ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Income source create/edit */}
            {incModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIncModal({ open: false, editing: null })}>
                    <div className="bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{incModal.editing ? "Editar Fuente de Ingresos" : "Nueva Fuente de Ingresos"}</h2>
                            <button onClick={() => setIncModal({ open: false, editing: null })} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="inc-name">Nombre <span className="text-red-500">*</span></Label>
                            <Input id="inc-name" value={incName} onChange={e => setIncName(e.target.value)} placeholder="ej: Nómina empresa, Alquiler piso..." autoFocus />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Categoría</Label>
                                <select value={incCategory} onChange={e => setIncCategory(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                    {INCOME_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Frecuencia</Label>
                                <select value={incFrequency} onChange={e => setIncFrequency(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                    {FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="inc-amount">Importe (€) <span className="text-red-500">*</span></Label>
                            <Input id="inc-amount" type="number" min="0" step="0.01" value={incAmount} onChange={e => setIncAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="inc-desc">Descripción <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                            <textarea id="inc-desc" value={incDescription} onChange={e => setIncDescription(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={incActive} onChange={e => setIncActive(e.target.checked)} className="rounded" />
                            <span className="text-sm">Fuente activa (incluir en proyecciones)</span>
                        </label>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setIncModal({ open: false, editing: null })}>Cancelar</Button>
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSaveInc} disabled={!incName.trim() || !incAmount || parseFloat(incAmount) <= 0 || incSaving}>
                                {incSaving ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Savings goal create/edit */}
            {goalModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setGoalModal({ open: false, editing: null })}>
                    <div className="bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{goalModal.editing ? "Editar Meta de Ahorro" : "Nueva Meta de Ahorro"}</h2>
                            <button onClick={() => setGoalModal({ open: false, editing: null })} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="goal-name">Nombre <span className="text-red-500">*</span></Label>
                            <Input id="goal-name" value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="ej: Fondo de emergencia, Vacaciones..." autoFocus />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="goal-target">Objetivo (€) <span className="text-red-500">*</span></Label>
                                <Input id="goal-target" type="number" min="0" step="0.01" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="goal-current">Ya ahorrado (€)</Label>
                                <Input id="goal-current" type="number" min="0" step="0.01" value={goalCurrent} onChange={e => setGoalCurrent(e.target.value)} placeholder="0.00" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="goal-deadline">Fecha límite <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                            <Input id="goal-deadline" type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {GOAL_COLORS.map(c => (
                                    <button key={c.id} onClick={() => setGoalColor(c.id)} className={`w-7 h-7 rounded-full ${c.id} transition-transform ${goalColor === c.id ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"}`} title={c.label} />
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setGoalModal({ open: false, editing: null })}>Cancelar</Button>
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSaveGoal} disabled={!goalName.trim() || !goalTarget || parseFloat(goalTarget) <= 0 || goalSaving}>
                                {goalSaving ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contribution modal */}
            {contributionGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setContributionGoal(null)}>
                    <div className="bg-background rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Aportar a meta</h2>
                            <button onClick={() => setContributionGoal(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="font-medium">{contributionGoal.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {formatCurrency(contributionGoal.current_amount)} ahorrados de {formatCurrency(contributionGoal.target_amount)}
                            </p>
                            <Progress value={Math.min((contributionGoal.current_amount / contributionGoal.target_amount) * 100, 100)} className="h-2 mt-2" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="contrib-amount">Importe a aportar (€) <span className="text-red-500">*</span></Label>
                            <Input
                                id="contrib-amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={contributionAmount}
                                onChange={e => setContributionAmount(e.target.value)}
                                placeholder="0.00"
                                autoFocus
                                onKeyDown={e => e.key === "Enter" && handleContribute()}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setContributionGoal(null)}>Cancelar</Button>
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleContribute} disabled={!contributionAmount || parseFloat(contributionAmount) <= 0 || contributionSaving}>
                                {contributionSaving ? "Guardando..." : "Aportar"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
