// app/products/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  // Allow products to be null initially / on error, and handle it safely
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadProducts = () => {
    setLoading(true);
    setError(null);

    apiFetch<Product[]>("/api/products")
      .then((data) => {
        setProducts(data);
      })
      .catch((err: any) => {
        setError(err?.message ?? "Failed to load products");
        // treat as empty list on error to avoid null issues
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete product #${id}?`
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      setActionMessage(`Product #${id} deleted.`);
      loadProducts();
    } catch (err: any) {
      setError(err?.message ?? "Failed to delete product");
    }
  };

  // Safely derive whether we have any products
  const productList = products ?? [];
  const hasProducts = productList.length > 0;

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>
          <Link
            href="/products/new"
            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            New Product
          </Link>
        </div>

        {actionMessage && (
          <p className="text-sm text-gray-700">{actionMessage}</p>
        )}
        {loading && <p className="text-gray-600">Loading products...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">ID</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">SKU</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-right font-medium">Stock</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!hasProducts && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
                {productList.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">{p.id}</td>
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{p.sku}</td>
                    <td className="px-3 py-2 text-right">
                      {p.price.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">{p.stock}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/products/${p.id}/edit`}
                          className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
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
