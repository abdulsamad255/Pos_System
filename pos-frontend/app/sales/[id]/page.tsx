// app/sales/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedPage } from "@/components/ProtectedPage";
import { apiFetch } from "@/lib/api";
import type { Sale } from "@/lib/types";

export default function SaleDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id =
    typeof rawId === "string"
      ? parseInt(rawId, 10)
      : Array.isArray(rawId)
      ? parseInt(rawId[0], 10)
      : NaN;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError("Invalid sale ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    apiFetch<Sale>(`/api/sales/${id}`)
      .then((data) => {
        setSale(data);
      })
      .catch((err: any) => {
        setError(err?.message ?? "Failed to load sale");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <ProtectedPage>
        <p className="text-sm text-gray-600">Loading sale...</p>
      </ProtectedPage>
    );
  }

  if (error || !sale) {
    return (
      <ProtectedPage>
        <div className="space-y-3">
          <p className="text-sm text-red-600">
            {error || "Sale not found."}
          </p>
          <Link href="/sales" className="text-blue-600 hover:underline">
            ← Back to Sales
          </Link>
        </div>
      </ProtectedPage>
    );
  }

  const items = sale.items ?? [];
  const change = sale.paid_amount - sale.total_amount;

  return (
    <ProtectedPage>
      <div className="space-y-4">
        {/* Top bar (hidden on print) */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-xl font-bold">Sale #{sale.id}</h1>
            <p className="text-sm text-gray-600">
              {new Date(sale.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
            >
              Print receipt
            </button>
            <Link
              href="/sales"
              className="rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back to Sales
            </Link>
          </div>
        </div>

        {/* Centered receipt layout (used for print) */}
        <div className="flex justify-center">
          <div className="w-full max-w-md rounded border bg-white p-4 text-sm shadow-sm print:shadow-none print:border-0">
            {/* Header */}
            <div className="text-center border-b pb-3 mb-3">
              <h2 className="text-lg font-bold">POS System</h2>
              <p className="text-xs text-gray-600">
                Receipt for Sale #{sale.id}
              </p>
              <p className="text-xs text-gray-600">
                {new Date(sale.created_at).toLocaleString()}
              </p>
            </div>

            {/* Items table */}
            <div className="mb-3">
              <table className="w-full text-xs">
                <thead className="border-b">
                  <tr>
                    <th className="py-1 text-left">Item</th>
                    <th className="py-1 text-right">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-3 text-center text-gray-500"
                      >
                        No items for this sale.
                      </td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="py-1 pr-2">
                        {item.product_name ?? `Product #${item.product_id}`}
                      </td>
                      <td className="py-1 text-right">{item.quantity}</td>
                      <td className="py-1 text-right">
                        {item.unit_price.toFixed(2)}
                      </td>
                      <td className="py-1 text-right">
                        {item.line_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="border-t pt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Total:</span>
                <span>{sale.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid:</span>
                <span>{sale.paid_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment method:</span>
                <span className="capitalize">
                  {sale.payment_method}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Change:</span>
                <span>{change.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 border-t pt-2 text-center text-[11px] text-gray-500">
              <p>Thank you for your purchase!</p>
            </div>
          </div>
        </div>

        {/* Back link for screen (hidden on print) */}
        <div className="print:hidden">
          <Link href="/sales" className="text-blue-600 hover:underline">
            ← Back to Sales
          </Link>
        </div>
      </div>
    </ProtectedPage>
  );
}
