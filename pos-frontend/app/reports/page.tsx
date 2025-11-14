// app/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ManagerPage } from "@/components/ManagerPage";
import { apiFetch } from "@/lib/api";

type Summary = {
  total_sales_count?: number;
  total_revenue?: number;
  total_items_sold?: number;
  // in case your backend uses camelCase:
  totalSalesCount?: number;
  totalRevenue?: number;
  totalItemsSold?: number;
};

type DailyRow = {
  date?: string;
  total_revenue?: number;
  total_sales_count?: number;
  total_items_sold?: number;
  totalRevenue?: number;
  totalSalesCount?: number;
  totalItemsSold?: number;
};

type TopProductRow = {
  product_id?: number;
  product_name?: string;
  total_quantity_sold?: number;
  total_revenue?: number;
  productId?: number;
  productName?: string;
  totalQuantitySold?: number;
  totalRevenue?: number;
};

export default function ReportsPage() {
  // Default range = last 7 days
  const today = new Date();
  const toDefault = today.toISOString().slice(0, 10);
  const fromDefault = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [from, setFrom] = useState(fromDefault);
  const [to, setTo] = useState(toDefault);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = `?from=${from}&to=${to}`;

    Promise.all([
      apiFetch<Summary>(`/api/reports/summary${params}`),
      apiFetch<DailyRow[]>(`/api/reports/daily${params}`),
      apiFetch<TopProductRow[]>(`/api/reports/top-products${params}`),
    ])
      .then(([summaryData, dailyData, topData]) => {
        setSummary(summaryData || null);
        setDaily(dailyData || []);
        setTopProducts(topData || []);
      })
      .catch((err: any) => {
        setError(err?.message ?? "Failed to load reports");
      })
      .finally(() => setLoading(false));
  }, [from, to]);

  // Helpers to safely read values if backend uses snake_case or camelCase
  const getSummaryValue = (fieldSnake: keyof Summary, fieldCamel: keyof Summary) => {
    if (!summary) return "-";
    const snake = summary[fieldSnake];
    const camel = summary[fieldCamel];
    return (snake ?? camel ?? "-") as any;
  };

  const formatNumber = (value: any, fractionDigits = 2) => {
    if (typeof value === "number") return value.toFixed(fractionDigits);
    return value ?? "-";
  };

  return (
    <ManagerPage>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Sales Reports (Manager only)</h1>

        {/* Date range filters */}
        <div className="flex flex-wrap items-end gap-3 rounded border bg-white p-3 text-sm">
          <div>
            <label className="mb-1 block font-medium">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded border px-2 py-1"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded border px-2 py-1"
            />
          </div>

          {loading && (
            <span className="text-xs text-gray-600">Loading...</span>
          )}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>

        {/* Summary card */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded border bg-white p-3 text-sm">
            <h2 className="mb-2 font-semibold">Summary</h2>
            <p>
              <span className="text-gray-600">Total sales:</span>{" "}
              {getSummaryValue("total_sales_count", "totalSalesCount")}
            </p>
            <p>
              <span className="text-gray-600">Total revenue:</span>{" "}
              {formatNumber(
                getSummaryValue("total_revenue", "totalRevenue"),
                2
              )}
            </p>
            <p>
              <span className="text-gray-600">Total items sold:</span>{" "}
              {getSummaryValue("total_items_sold", "totalItemsSold")}
            </p>
          </div>
        </section>

        {/* Daily sales table */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Daily sales</h2>
          <div className="overflow-x-auto rounded border bg-white text-sm">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-right">Sales count</th>
                  <th className="px-3 py-2 text-right">Items sold</th>
                </tr>
              </thead>
              <tbody>
                {daily.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No data for this period.
                    </td>
                  </tr>
                )}
                {daily.map((row, idx) => {
                  const revenue = row.total_revenue ?? row.totalRevenue;
                  const salesCount =
                    row.total_sales_count ?? row.totalSalesCount;
                  const itemsSold =
                    row.total_items_sold ?? row.totalItemsSold;

                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">
                        {row.date ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(revenue, 2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {salesCount ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {itemsSold ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top products table */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Top products</h2>
          <div className="overflow-x-auto rounded border bg-white text-sm">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-right">Quantity sold</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No data for this period.
                    </td>
                  </tr>
                )}
                {topProducts.map((row, idx) => {
                  const name = row.product_name ?? row.productName ?? "-";
                  const qty =
                    row.total_quantity_sold ?? row.totalQuantitySold;
                  const revenue = row.total_revenue ?? row.totalRevenue;

                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{name}</td>
                      <td className="px-3 py-2 text-right">
                        {qty ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(revenue, 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ManagerPage>
  );
}
