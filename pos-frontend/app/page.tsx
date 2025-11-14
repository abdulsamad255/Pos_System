// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function HomePage() {
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loadingLowStock, setLoadingLowStock] = useState(true);
  const [lowStockError, setLowStockError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch products that are low in stock (threshold = 5)
    setLoadingLowStock(true);
    setLowStockError(null);

    apiFetch<Product[]>("/api/products/low-stock?threshold=5")
      .then((data) => {
        setLowStock(data ?? []);
      })
      .catch((err: any) => {
        setLowStockError(
          err?.message ?? "Failed to load low stock products"
        );
      })
      .finally(() => {
        setLoadingLowStock(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Top: main dashboard text + quick links */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-700">
          Welcome to your POS system. Use the navigation or the quick actions
          below to manage products or run sales.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/pos"
            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Open POS
          </Link>

          <Link
            href="/products"
            className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
          >
            View Products
          </Link>

          <Link
            href="/sales"
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            View Sales
          </Link>

          <Link
            href="/login"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Bottom: Low stock products card */}
      <section className="max-w-xl rounded border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Low stock products</h2>
        <p className="mb-3 text-sm text-gray-600">
          Showing products with stock less than or equal to 5.
        </p>

        {loadingLowStock && (
          <p className="text-sm text-gray-600">Loading low stock products...</p>
        )}

        {lowStockError && (
          <p className="text-sm text-red-600">{lowStockError}</p>
        )}

        {!loadingLowStock && !lowStockError && lowStock.length === 0 && (
          <p className="text-sm text-gray-600">
            All good! No products are currently low in stock.
          </p>
        )}

        {!loadingLowStock && !lowStockError && lowStock.length > 0 && (
          <div className="overflow-x-auto rounded border bg-white text-sm">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{p.sku}</td>
                    <td className="px-3 py-2 text-right">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
