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

interface SpendingChartsProps {
  categorySpending: CategorySpending[];
  topSpenders: TopSpender[];
  dailySpending: DailySpending[];
}

const PALETTE = ['#6366f1', '#06b6d4', '#ec4899', '#f97316', '#10b981', '#eab308', '#8b5cf6', '#ef4444'];

export function SpendingCharts({
  categorySpending,
  topSpenders,
  dailySpending,
}: SpendingChartsProps) {
  const categoryData = categorySpending.map((c, i) => ({
    name: c.categoryName,
    value: paiseToRupees(c.totalPaise),
    color: c.categoryColor || PALETTE[i % PALETTE.length],
  }));

  const personData = topSpenders.map((s) => ({
    name: s.member.name,
    amount: paiseToRupees(s.totalPaidPaise),
    color: s.member.color || '#6366f1',
  }));

  const timelineData = dailySpending.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    amount: paiseToRupees(d.totalPaise),
  }));

  return (
    <div className="space-y-6">
      {/* Category Pie & Breakdown */}
      <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-5 md:p-6 backdrop-blur-xl">
        <h3 className="text-base font-bold font-outfit text-white mb-4">Spending by Category</h3>
        
        {categoryData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Spent']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {categorySpending.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: cat.categoryColor || PALETTE[idx % PALETTE.length] }} 
                    />
                    <span className="text-xs font-medium text-slate-200">{cat.categoryIcon} {cat.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-outfit text-white block">
                      {formatRupees(cat.totalPaise)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-8">No expense data recorded yet</p>
        )}
      </div>

      {/* Spending by Person Bar Chart */}
      <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-5 md:p-6 backdrop-blur-xl">
        <h3 className="text-base font-bold font-outfit text-white mb-4">Total Paid by Crew Member</h3>
        
        {personData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Paid']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {personData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-8">No member expenses recorded yet</p>
        )}
      </div>

      {/* Spending Over Time Area Chart */}
      {timelineData.length > 1 && (
        <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-5 md:p-6 backdrop-blur-xl">
          <h3 className="text-base font-bold font-outfit text-white mb-4">Daily Spending Trend</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Total']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
