"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedPage } from "@/components/ProtectedPage";
import { apiFetch } from "@/lib/api";
import type { Sale } from "@/lib/types";

export default function SalesListPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Sale[]>("/api/sales")
      .then((data) => {
        setSales(data || []);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load sales");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Sales</h1>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && sales.length === 0 && (
          <p>No sales found.</p>
        )}

        {sales.length > 0 && (
          <div className="overflow-x-auto rounded border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Total</th>
                  <th className="px-3 py-2 text-left">Payment</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-t">
                    <td className="px-3 py-2">#{sale.id}</td>
                    <td className="px-3 py-2">
                      {new Date(sale.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{sale.total_amount.toFixed(2)}</td>
                    <td className="px-3 py-2 capitalize">{sale.payment_method}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/sales/${sale.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
