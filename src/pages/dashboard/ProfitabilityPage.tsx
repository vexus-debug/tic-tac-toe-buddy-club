import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { useProfitabilityData, useExpenseBreakdown } from "@/hooks/useProfitability";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["hsl(174, 60%, 40%)", "hsl(220, 60%, 20%)", "hsl(174, 50%, 50%)", "hsl(220, 50%, 30%)", "hsl(165, 40%, 50%)", "hsl(210, 30%, 60%)", "hsl(0, 50%, 50%)", "hsl(30, 60%, 50%)"];

function formatCurrency(amount: number) {
  return `₦${(amount / 1000000).toFixed(1)}M`;
}

function formatCurrencyFull(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border) / 0.5)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 8px 24px -4px hsl(var(--foreground) / 0.1)",
};

export default function ProfitabilityPage() {
  const { data } = useProfitabilityData();
  const { data: expenseBreakdown = [] } = useExpenseBreakdown();

  const monthly = data?.monthly || [];
  const totals = data?.totals || { revenue: 0, expenses: 0, profit: 0, margin: 0 };

  return (
    <div className="space-y-6">
      <PageHeader title="Profitability" description="Revenue vs expenses with profit margins" />

      <motion.div className="grid gap-4 sm:grid-cols-4" variants={stagger.container} initial="hidden" animate="visible">
        {[
          { label: "Total Revenue", value: totals.revenue, icon: TrendingUp, color: "emerald", formatter: formatCurrencyFull },
          { label: "Total Expenses", value: totals.expenses, icon: TrendingDown, color: "red", formatter: formatCurrencyFull },
          { label: "Net Profit", value: totals.profit, icon: DollarSign, color: totals.profit >= 0 ? "emerald" : "red", formatter: formatCurrencyFull },
          { label: "Profit Margin", value: totals.margin, icon: Percent, color: totals.margin >= 0 ? "blue" : "red", suffix: "%" },
        ].map((card, i) => (
          <motion.div key={i} variants={stagger.item}>
            <Card className="glass-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl bg-${card.color}-500/10 flex items-center justify-center`}>
                  <card.icon className={`h-5 w-5 text-${card.color}-600`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold">
                    {card.formatter ? <AnimatedCounter value={card.value} formatter={card.formatter} /> : <><AnimatedCounter value={card.value} />{card.suffix}</>}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="grid gap-4 lg:grid-cols-2" variants={stagger.container} initial="hidden" animate="visible">
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-border/30">
              <CardTitle className="text-base">Revenue vs Expenses (6 Months)</CardTitle>
              <CardDescription>Monthly comparison with profit line</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₦${v.toLocaleString()}`, ""]} />
                    <Bar dataKey="revenue" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="expenses" fill="hsl(0, 50%, 55%)" radius={[4, 4, 0, 0]} name="Expenses" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-border/30">
              <CardTitle className="text-base">Expense Breakdown (This Month)</CardTitle>
              <CardDescription>Spending by category</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {expenseBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16">No expense data this month.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₦${v.toLocaleString()}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Margin Trend */}
        <motion.div variants={stagger.item} className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-border/30">
              <CardTitle className="text-base">Profit Margin Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No data yet.</p>
              ) : (
                <div className="grid grid-cols-6 gap-3">
                  {monthly.map((m) => (
                    <div key={m.month} className="text-center space-y-2">
                      <div className={`mx-auto h-16 w-8 rounded-full overflow-hidden bg-muted relative`}>
                        <motion.div
                          className={`absolute bottom-0 w-full rounded-full ${m.margin >= 0 ? "bg-emerald-500/60" : "bg-red-500/60"}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.min(Math.abs(m.margin), 100)}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <p className="text-xs font-bold">{m.margin}%</p>
                      <p className="text-[10px] text-muted-foreground">{m.month.split(" ")[0]}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
