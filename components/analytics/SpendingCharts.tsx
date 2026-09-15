'use client';

import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area
} from 'recharts';
import { formatRupees, paiseToRupees } from '@/lib/currency';
import type { CategorySpending, DailySpending, TopSpender } from '@/types';
import { PieChart as PieIcon, BarChart2, TrendingUp, Wallet } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface SpendingChartsProps {
  categorySpending: CategorySpending[];
  topSpenders: TopSpender[];
  dailySpending: DailySpending[];
}

// 12 Compulsory distinct vibrant colors for category spending
const COMPULSORY_PALETTE = [
  '#2b56ff', // Electric Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber Orange
  '#ef4444', // Crimson Red
  '#8b5cf6', // Deep Violet
  '#ec4899', // Hot Pink
  '#06b6d4', // Bright Cyan
  '#84cc16', // Lime Green
  '#f43f5e', // Vivid Rose
  '#14b8a6', // Dark Teal
  '#a855f7', // Bright Purple
  '#d97706', // Burnt Amber
];

// Clean compact Pie chart label (Icon + Percentage only, fits perfectly without overflow)
const renderCompactPieLabel = ({ cx, cy, midAngle, outerRadius, percentage, icon }: any) => {
  if (percentage < 3) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 16;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="var(--text-primary)"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-[11px] font-extrabold font-outfit fill-[var(--text-primary)]"
    >
      {`${icon} ${percentage.toFixed(0)}%`}
    </text>
  );
};

export function SpendingCharts({
  categorySpending,
  topSpenders,
  dailySpending,
}: SpendingChartsProps) {
  const totalCategoryPaise = categorySpending.reduce((acc, c) => acc + c.totalPaise, 0);

  // Assign a compulsory distinct color to every category
  const categoryData = categorySpending.map((c, i) => ({
    name: `${c.categoryIcon} ${c.categoryName}`,
    rawName: c.categoryName,
    icon: c.categoryIcon,
    value: paiseToRupees(c.totalPaise),
    percentage: c.percentage,
    color: COMPULSORY_PALETTE[i % COMPULSORY_PALETTE.length],
  }));

  const totalMemberPaise = topSpenders.reduce((acc, s) => acc + s.totalPaidPaise, 0);

  // Filter ONLY members who have paid > 0
  const activePayers = topSpenders.filter((s) => s.totalPaidPaise > 0);

  const personData = activePayers.map((s) => ({
    name: s.member.name,
    amount: paiseToRupees(s.totalPaidPaise),
    color: s.member.color || '#2b56ff',
    member: s.member,
    totalPaidPaise: s.totalPaidPaise,
    percentage: totalMemberPaise > 0 ? (s.totalPaidPaise / totalMemberPaise) * 100 : 0,
  }));

  const timelineData = dailySpending.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    amount: paiseToRupees(d.totalPaise),
    count: d.expenseCount,
  }));

  return (
    <div className="space-y-6">
      {/* Category Pie & Neumorphic Legend */}
      <div className="raised-card p-5 sm:p-6 space-y-5 bg-[var(--surface-raised)] border border-[var(--border)] shadow-[var(--shadow-raised)] rounded-3xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20 shadow-sm">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-outfit text-[var(--text-primary)] leading-tight">
                Spending by Category
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-0.5">
                Category breakdown & share percentage
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold font-mono text-[var(--accent)] px-3 py-1 rounded-xl bg-[var(--surface-inset)] border border-[var(--border)]">
            {formatRupees(totalCategoryPaise)}
          </span>
        </div>
        
        {categoryData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Donut Chart with Compact Labels (Icon + % only) */}
            <div className="h-72 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="var(--surface-raised)"
                    strokeWidth={2}
                    label={renderCompactPieLabel}
                    labelLine={{ stroke: 'var(--border)', strokeWidth: 1.5 }}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `₹${Number(value).toFixed(2)}`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: 'var(--surface-raised)',
                      borderColor: 'var(--border)',
                      borderRadius: '16px',
                      color: 'var(--text-primary)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] font-mono">
                  Categories
                </span>
                <span className="text-base font-black font-outfit text-[var(--text-primary)]">
                  {categorySpending.length}
                </span>
              </div>
            </div>

            {/* Premium Neumorphic Legend List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-none">
              {categorySpending.map((cat, idx) => {
                const color = COMPULSORY_PALETTE[idx % COMPULSORY_PALETTE.length];
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[var(--surface-inset)] border border-[var(--border)] shadow-[var(--shadow-inset)] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span 
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" 
                          style={{ backgroundColor: color }} 
                        />
                        <span className="text-xs font-bold text-[var(--text-primary)] font-outfit truncate">
                          {cat.categoryIcon} {cat.categoryName}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-extrabold font-outfit text-[var(--text-primary)]">
                          {formatRupees(cat.totalPaise)}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold ml-1.5">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] text-center py-8">No expense category data recorded yet</p>
        )}
      </div>

      {/* Spending by Person Bar Chart & Leaderboard */}
      <div className="raised-card p-5 sm:p-6 space-y-5 bg-[var(--surface-raised)] border border-[var(--border)] shadow-[var(--shadow-raised)] rounded-3xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-outfit text-[var(--text-primary)] leading-tight">
                Crew Spend Contribution
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-0.5">
                Individual payment distribution
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--text-muted)]">
            {activePayers.length} active payer{activePayers.length === 1 ? '' : 's'}
          </span>
        </div>
        
        {activePayers.length === 1 ? (
          /* Single Payer View — do not render bar chart when only 1 person has paid */
          <div className="p-5 rounded-2xl bg-[var(--surface-inset)] border border-[var(--border)] shadow-[var(--shadow-inset)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <Avatar name={activePayers[0].member.name} color={activePayers[0].member.color} size="md" />
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h4 className="text-sm font-extrabold font-outfit text-[var(--text-primary)]">
                    {activePayers[0].member.name}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
                    Sole Payer (100%)
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Has paid for all trip expenses so far.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold font-outfit text-emerald-600 dark:text-emerald-400">
                {formatRupees(activePayers[0].totalPaidPaise)}
              </span>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">100% of total trip spend</p>
            </div>
          </div>
        ) : personData.length > 1 ? (
          /* Multiple Payers Bar Chart */
          <div className="space-y-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personData} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Total Paid']}
                    contentStyle={{
                      backgroundColor: 'var(--surface-raised)',
                      borderColor: 'var(--border)',
                      borderRadius: '16px',
                      color: 'var(--text-primary)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                    {personData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Active Payers Contribution List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {personData.map((p) => (
                <div
                  key={p.member.id}
                  className="p-3 rounded-2xl bg-[var(--surface-inset)] border border-[var(--border)] shadow-[var(--shadow-inset)] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={p.member.name} color={p.color} size="xs" />
                    <span className="text-xs font-bold text-[var(--text-primary)] font-outfit truncate">
                      {p.member.name}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold font-outfit text-[var(--text-primary)] block">
                      {formatRupees(p.totalPaidPaise)}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono font-semibold">
                      {p.percentage.toFixed(1)}% of trip
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] text-center py-8">No member expenses recorded yet</p>
        )}
      </div>

      {/* Daily Spending Trend Area/Line Chart */}
      {timelineData.length > 0 && (
        <div className="raised-card p-5 sm:p-6 space-y-4 bg-[var(--surface-raised)] border border-[var(--border)] shadow-[var(--shadow-raised)] rounded-3xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold font-outfit text-[var(--text-primary)] leading-tight">
                  Daily Spending Trend
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-0.5">
                  Spend velocity over time
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--text-muted)]">
              {timelineData.length} active day{timelineData.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2b56ff" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#2b56ff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `₹${Number(value).toFixed(2)} (${item.payload.count} bill${item.payload.count === 1 ? '' : 's'})`,
                    'Daily Spend',
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--surface-raised)',
                    borderColor: 'var(--border)',
                    borderRadius: '16px',
                    color: 'var(--text-primary)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#2b56ff"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#spendGrad)"
                  dot={{ r: 5, fill: '#2b56ff', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#2b56ff', stroke: 'var(--border)', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
