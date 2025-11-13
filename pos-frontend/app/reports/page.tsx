// app/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { apiFetch } from "@/lib/api";
import type {
  SalesSummary,
  DailySalesRow,
  TopProductRow,
} from "@/lib/types";

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 6); // last 7 days
  return d.toISOString().slice(0, 10);
}

function defaultToDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  const [summary, setSummary] = useState<SalesSummary | null>(null);

  // 👇 allow null internally, and treat it as [] when rendering
  const [daily, setDaily] = useState<DailySalesRow[] | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductRow[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setError(null);
    setLoading(true);

    try {
      const query = `?from=${fromDate}&to=${toDate}`;

      const [summaryRes, dailyRes, topRes] = await Promise.all([
        apiFetch<SalesSummary>(`/api/reports/summary${query}`),
        apiFetch<DailySalesRow[]>(`/api/reports/daily${query}`),
        apiFetch<TopProductRow[]>(`/api/reports/top-products${query}&limit=5`),
      ]);

      setSummary(summaryRes);
      setDaily(dailyRes ?? []); // 👈 ensure array, never null
      setTopProducts(topRes ?? []); // 👈 ensure array, never null
    } catch (err: any) {
      setError(err?.message ?? "Failed to load reports");
      // On error, treat as empty to keep UI stable
      setSummary(null);
      setDaily([]);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports();
  };

  // 👇 safe lists so we never call .length on null
  const dailyList = daily ?? [];
  const topList = topProducts ?? [];

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Reports</h1>

        {/* Date range filters */}
        <form
          className="flex flex-col gap-3 rounded border bg-white p-4 md:flex-row md:items-center md:justify-between"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div>
              <label className="mb-1 block text-sm font-medium">From</label>
              <input
                type="date"
                className="rounded border px-3 py-2 text-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">To</label>
              <input
                type="date"
                className="rounded border px-3 py-2 text-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load Reports"}
            </button>
          </div>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Summary card */}
        <section className="rounded border bg-white p-4">
          <h2 className="mb-2 text-lg font-bold">Summary</h2>
          {!summary && !loading && (
            <p className="text-sm text-gray-600">No data available.</p>
          )}
          {summary && (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-xl font-bold">{summary.total_sales}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold">
                  {summary.total_revenue.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Items Sold</p>
                <p className="text-xl font-bold">{summary.total_items}</p>
              </div>
            </div>
          )}
        </section>

        {/* Daily sales table */}
        <section className="rounded border bg-white p-4">
          <h2 className="mb-2 text-lg font-bold">Daily Sales</h2>
          {dailyList.length === 0 && !loading && (
            <p className="text-sm text-gray-600">No daily data.</p>
          )}
          {dailyList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Sales
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailyList.map((row) => (
                    <tr key={row.date} className="border-t">
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2 text-right">
                        {row.total_sales}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.total_revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Top products */}
        <section className="rounded border bg-white p-4">
          <h2 className="mb-2 text-lg font-bold">Top Products</h2>
          {topList.length === 0 && !loading && (
            <p className="text-sm text-gray-600">No top products data.</p>
          )}
          {topList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      Product
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Quantity
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topList.map((p) => (
                    <tr key={p.product_id} className="border-t">
                      <td className="px-3 py-2">{p.product_name}</td>
                      <td className="px-3 py-2 text-right">{p.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        {p.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </ProtectedPage>
  );
}
