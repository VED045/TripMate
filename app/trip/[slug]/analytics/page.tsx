'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Wallet,
  Users,
  Camera,
  Calendar,
  Sparkles,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { StatCard } from '@/components/shared/StatCard';
import { SpendingCharts } from '@/components/analytics/SpendingCharts';
import { LeaderboardList } from '@/components/analytics/LeaderboardList';
import { TripPulseWidget } from '@/components/analytics/TripPulseWidget';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/SkeletonLoader';
import { formatRupees, paiseToRupees } from '@/lib/currency';
import type {
  ExpenseWithDetails,
  MediaWithDetails,
  CategorySpending,
  TopSpender,
  DailySpending,
  TripPulseItem,
  Member
} from '@/types';

export default function AnalyticsPage() {
  const { trip, members } = useActiveTrip();

  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [mediaList, setMediaList] = useState<MediaWithDetails[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [topSpenders, setTopSpenders] = useState<TopSpender[]>([]);
  const [dailySpending, setDailySpending] = useState<DailySpending[]>([]);
  const [pulseItems, setPulseItems] = useState<TripPulseItem[]>([]);
  const [mostPhotographed, setMostPhotographed] = useState<{ member: Member; count: number } | null>(null);
  const [totalSpentPaise, setTotalSpentPaise] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!trip) return;

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const [eRes, mRes] = await Promise.all([
          fetch(`/api/expenses?trip_id=${trip.id}`),
          fetch(`/api/media?trip_id=${trip.id}`),
        ]);

        const eData: ExpenseWithDetails[] = eRes.ok ? await eRes.json() : [];
        const mData: MediaWithDetails[] = mRes.ok ? await mRes.json() : [];

        setExpenses(eData);
        setMediaList(mData);

        // 1. Total spent
        const total = eData.reduce((acc, curr) => acc + curr.amount_paise, 0);
        setTotalSpentPaise(total);

        // 2. Category spending
        const catMap: { [id: string]: { name: string; icon: string; color: string; total: number; count: number } } = {};
        eData.forEach((e) => {
          const catId = e.category_id || 'other';
          const catName = e.category?.name || 'General';
          const icon = e.category?.icon || '💸';
          const color = e.category?.color || '#6366f1';

          if (!catMap[catId]) {
            catMap[catId] = { name: catName, icon, color, total: 0, count: 0 };
          }
          catMap[catId].total += e.amount_paise;
          catMap[catId].count += 1;
        });

        const catArray: CategorySpending[] = Object.entries(catMap).map(([id, c]) => ({
          categoryId: id,
          categoryName: c.name,
          categoryIcon: c.icon,
          categoryColor: c.color,
          totalPaise: c.total,
          percentage: total > 0 ? (c.total / total) * 100 : 0,
          count: c.count,
        })).sort((a, b) => b.totalPaise - a.totalPaise);

        setCategorySpending(catArray);

        // 3. Spenders
        const paidMap: { [id: string]: number } = {};
        members.forEach((m) => (paidMap[m.id] = 0));
        eData.forEach((e) => {
          if (e.paid_by) paidMap[e.paid_by] = (paidMap[e.paid_by] || 0) + e.amount_paise;
        });

        const spenders: TopSpender[] = members
          .map((m) => ({
            member: m,
            totalPaidPaise: paidMap[m.id] || 0,
            rank: 0,
          }))
          .sort((a, b) => b.totalPaidPaise - a.totalPaidPaise)
          .map((s, idx) => ({ ...s, rank: idx + 1 }));

        setTopSpenders(spenders);

        // 4. Daily spending
        const dayMap: { [date: string]: { total: number; count: number } } = {};
        eData.forEach((e) => {
          const d = e.expense_date;
          if (!dayMap[d]) dayMap[d] = { total: 0, count: 0 };
          dayMap[d].total += e.amount_paise;
          dayMap[d].count += 1;
        });

        const days: DailySpending[] = Object.entries(dayMap)
          .map(([date, d]) => ({
            date,
            totalPaise: d.total,
            expenseCount: d.count,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setDailySpending(days);

        // 5. Most Photographed
        const tagCountMap: { [id: string]: number } = {};
        mData.forEach((m) => {
          m.tags?.forEach((t) => {
            tagCountMap[t.member_id] = (tagCountMap[t.member_id] || 0) + 1;
          });
        });

        let topTagMember: Member | null = null;
        let maxTags = 0;
        members.forEach((m) => {
          const count = tagCountMap[m.id] || 0;
          if (count > maxTags) {
            maxTags = count;
            topTagMember = m;
          }
        });

        if (topTagMember && maxTags > 0) {
          setMostPhotographed({ member: topTagMember, count: maxTags });
        }

        // 6. Pulse items
        const pulse: TripPulseItem[] = [];
        if (total > 0) {
          pulse.push({
            icon: '🔥',
            text: `Average spending per person is`,
            value: formatRupees(members.length > 0 ? total / members.length : 0),
          });
        }
        if (catArray[0]) {
          pulse.push({
            icon: '📊',
            text: `Top spending category is ${catArray[0].categoryName} (${catArray[0].percentage.toFixed(0)}% of total)`,
          });
        }
        if (days.length > 0) {
          const highestDay = [...days].sort((a, b) => b.totalPaise - a.totalPaise)[0];
          pulse.push({
            icon: '📅',
            text: `Biggest spending day was on ${highestDay.date}`,
            value: formatRupees(highestDay.totalPaise),
          });
        }
        setPulseItems(pulse);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [trip?.id, members]);

  if (!trip) {
    return <div className="p-6"><CardSkeleton /></div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <TripHeader title="Trip Pulse & Analytics" subtitle="Pure analytics engine, charts & superlatives" />

      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Top Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Total Spent"
            value={formatRupees(totalSpentPaise)}
            icon={Wallet}
            color="indigo"
          />
          <StatCard
            title="Avg / Person"
            value={formatRupees(members.length > 0 ? totalSpentPaise / members.length : 0)}
            icon={Users}
            color="cyan"
          />
          <StatCard
            title="Expenses Logged"
            value={expenses.length}
            icon={BarChart3}
            color="pink"
          />
          <StatCard
            title="Vault Photos"
            value={mediaList.length}
            icon={Camera}
            color="emerald"
          />
        </div>

        {/* Dynamic Trip Pulse Insights */}
        {pulseItems.length > 0 && <TripPulseWidget pulseItems={pulseItems} />}

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SpendingCharts
              categorySpending={categorySpending}
              topSpenders={topSpenders}
              dailySpending={dailySpending}
            />
          </div>

          <div className="lg:col-span-1">
            <LeaderboardList
              topSpenders={topSpenders}
              mostPhotographed={mostPhotographed}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
