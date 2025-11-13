// app/products/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProductForm } from "@/components/ProductForm";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id =
    typeof idParam === "string"
      ? parseInt(idParam, 10)
      : parseInt((idParam as string[])[0], 10);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoadError("Invalid product ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    apiFetch<Product>(`/api/products/${id}`)
      .then((p) => {
        setProduct(p);
      })
      .catch((err: any) => {
        setLoadError(err?.message ?? "Failed to load product");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleUpdate = async (data: {
    name: string;
    sku: string;
    price: number;
    stock: number;
  }) => {
    await apiFetch(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    router.push("/products");
  };

  return (
    <ProtectedPage>
      <div className="mx-auto max-w-md rounded bg-white p-6 shadow">
        {loading && <p className="text-sm text-gray-600">Loading...</p>}
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        {!loading && !loadError && product && (
          <>
            <h1 className="mb-4 text-xl font-bold">
              Edit Product #{product.id}
            </h1>
            <ProductForm
              initialProduct={product}
              onSubmit={handleUpdate}
              submitLabel="Update Product"
            />
          </>
        )}
      </div>
    </ProtectedPage>
  );
}
