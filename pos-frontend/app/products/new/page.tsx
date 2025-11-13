// app/products/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProductForm } from "@/components/ProductForm";
import { apiFetch } from "@/lib/api";

export default function NewProductPage() {
  const router = useRouter();

  const handleCreate = async (data: {
    name: string;
    sku: string;
    price: number;
    stock: number;
  }) => {
    await apiFetch("/api/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // On success, go back to products list
    router.push("/products");
  };

  return (
    <ProtectedPage>
      <div className="mx-auto max-w-md rounded bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-bold">New Product</h1>
        <ProductForm onSubmit={handleCreate} submitLabel="Create Product" />
      </div>
    </ProtectedPage>
  );
}
