// components/ProductForm.tsx
"use client";

import { FormEvent, useState } from "react";
import type { Product } from "@/lib/types";

type ProductFormProps = {
  initialProduct?: Product;
  onSubmit: (data: {
    name: string;
    sku: string;
    price: number;
    stock: number;
  }) => Promise<void>;
  submitLabel: string;
};

export function ProductForm({
  initialProduct,
  onSubmit,
  submitLabel,
}: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [sku, setSku] = useState(initialProduct?.sku ?? "");

  /** 👇 CHANGE #1 – price starts empty unless editing */
  const [price, setPrice] = useState(
    initialProduct ? initialProduct.price : ("" as any)
  );

  /** 👇 CHANGE #2 – stock starts empty unless editing */
  const [stock, setStock] = useState(
    initialProduct ? initialProduct.stock : ("" as any)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        sku: sku.trim(),
        price: Number(price),
        stock: Number(stock),
      });
    } catch (err: any) {
      setError(err?.message ?? "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          type="text"
          className="w-full rounded border px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">SKU</label>
        <input
          type="text"
          className="w-full rounded border px-3 py-2 text-sm"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Price</label>
          <input
            type="number"
            min={0}
            step="0.01"
            className="w-full rounded border px-3 py-2 text-sm"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Stock</label>
          <input
            type="number"
            min={0}
            step="1"
            className="w-full rounded border px-3 py-2 text-sm"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
