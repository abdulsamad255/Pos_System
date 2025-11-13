// app/pos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { apiFetch } from "@/lib/api";
import type { Product, Sale } from "@/lib/types";

type CartItem = {
  product: Product;
  quantity: number;
};

export default function POSPage() {
  // allow null internally and treat as [] when rendering
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[] | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  // Load products from backend
  useEffect(() => {
    setLoadingProducts(true);
    setProductsError(null);

    apiFetch<Product[]>("/api/products")
      .then((data) => {
        setProducts(data ?? []);
      })
      .catch((err: any) => {
        setProductsError(err?.message ?? "Failed to load products");
        setProducts([]);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, []);

  // safe lists so we never read .length from null
  const productList = products ?? [];
  const cartList = cart ?? [];

  // Filtered products by search string
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productList;

    return productList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        String(p.id).includes(q)
    );
  }, [productList, search]);

  // Cart helpers
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const current = prev ?? [];
      const existing = current.find((ci) => ci.product.id === product.id);
      if (!existing) {
        if (product.stock <= 0) return current; // can't add if no stock
        return [...current, { product, quantity: 1 }];
      }

      const newQty = Math.min(existing.quantity + 1, product.stock);
      return current.map((ci) =>
        ci.product.id === product.id ? { ...ci, quantity: newQty } : ci
      );
    });
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    setCart((prev) => {
      const current = prev ?? [];
      const updated = current
        .map((ci) => {
          if (ci.product.id !== productId) return ci;
          const maxQty = ci.product.stock;
          const q = Math.max(1, Math.min(quantity, maxQty));
          return { ...ci, quantity: q };
        })
        .filter((ci) => ci.quantity > 0);
      return updated;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const current = prev ?? [];
      return current.filter((ci) => ci.product.id !== productId);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // Totals
  const cartSubtotal = useMemo(
    () =>
      cartList.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      ),
    [cartList]
  );

  // Keep paidAmount in sync when subtotal changes (if cart non-empty)
  useEffect(() => {
    if (cartList.length === 0) {
      setPaidAmount(0);
    } else {
      setPaidAmount((current) =>
        current === 0 ? Number(cartSubtotal.toFixed(2)) : current
      );
    }
  }, [cartSubtotal, cartList.length]);

  const handleCheckout = async () => {
    setCheckoutError(null);
    setCheckoutSuccess(null);

    if (cartList.length === 0) {
      setCheckoutError("Cart is empty.");
      return;
    }

    if (paidAmount < 0) {
      setCheckoutError("Paid amount cannot be negative.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cartList.map((ci) => ({
          product_id: ci.product.id,
          quantity: ci.quantity,
          // unit_price omitted: backend will use current product price
        })),
      payment_method: paymentMethod,
      paid_amount: paidAmount,
      };

      const sale = await apiFetch<Sale>("/api/sales", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCheckoutSuccess(
        `Sale #${sale.id} created successfully. Total: ${sale.total_amount.toFixed(
          2
        )}`
      );
      clearCart();

      // Refresh products to update stock
      setLoadingProducts(true);
      apiFetch<Product[]>("/api/products")
        .then((data) => {
          setProducts(data ?? []);
        })
        .catch((err: any) => {
          setProductsError(err?.message ?? "Failed to refresh products");
          setProducts([]);
        })
        .finally(() => {
          setLoadingProducts(false);
        });
    } catch (err: any) {
      setCheckoutError(err?.message ?? "Failed to create sale");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: products list */}
        <section className="rounded border bg-white p-4">
          <h1 className="mb-3 text-xl font-bold">POS - Products</h1>

          <div className="mb-3">
            <input
              type="text"
              placeholder="Search by name, SKU or ID..."
              className="w-full rounded border px-3 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loadingProducts && (
            <p className="text-sm text-gray-600">Loading products...</p>
          )}
          {productsError && (
            <p className="text-sm text-red-600">{productsError}</p>
          )}

          {!loadingProducts && !productsError && (
            <div className="max-h-[400px] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium">Name</th>
                    <th className="px-2 py-2 text-left font-medium">SKU</th>
                    <th className="px-2 py-2 text-right font-medium">Price</th>
                    <th className="px-2 py-2 text-right font-medium">
                      Stock
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        No products found.
                      </td>
                    </tr>
                  )}
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-2 py-2">{p.name}</td>
                      <td className="px-2 py-2">{p.sku}</td>
                      <td className="px-2 py-2 text-right">
                        {p.price.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">{p.stock}</td>
                      <td className="px-2 py-2 text-right">
                        <button
                          disabled={p.stock <= 0}
                          onClick={() => addToCart(p)}
                          className="rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-60"
                        >
                          {p.stock > 0 ? "Add" : "Out of stock"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right: cart & checkout */}
        <section className="rounded border bg-white p-4">
          <h2 className="mb-3 text-xl font-bold">Cart</h2>

          {cartList.length === 0 && (
            <p className="text-sm text-gray-600">No items in cart.</p>
          )}

          {cartList.length > 0 && (
            <div className="mb-4 max-h-64 overflow-y-auto border-b pb-3">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium">Item</th>
                    <th className="px-2 py-2 text-right font-medium">Qty</th>
                    <th className="px-2 py-2 text-right font-medium">
                      Price
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      Total
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      Remove
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cartList.map((ci) => (
                    <tr key={ci.product.id} className="border-t">
                      <td className="px-2 py-2">
                        <div className="text-sm font-medium">
                          {ci.product.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          SKU: {ci.product.sku}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          min={1}
                          max={ci.product.stock}
                          value={ci.quantity}
                          onChange={(e) =>
                            updateCartQuantity(
                              ci.product.id,
                              Number(e.target.value)
                            )
                          }
                          className="w-16 rounded border px-2 py-1 text-sm"
                        />
                        <div className="mt-1 text-xs text-gray-500">
                          Stock: {ci.product.stock}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right">
                        {ci.product.price.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {(ci.product.price * ci.quantity).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={() => removeFromCart(ci.product.id)}
                          className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subtotal:</span>
              <span className="text-lg font-bold">
                {cartSubtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as "cash" | "card")
                  }
                  className="w-full rounded border px-3 py-2 text-sm md:w-40"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Paid Amount
                </label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2 text-sm md:w-40"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  min={0}
                  step="0.01"
                />
              </div>
            </div>

            {checkoutError && (
              <p className="text-sm text-red-600">{checkoutError}</p>
            )}
            {checkoutSuccess && (
              <p className="text-sm text-gray-700">{checkoutSuccess}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={submitting || cartList.length === 0}
              className="w-full rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {submitting ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </section>
      </div>
    </ProtectedPage>
  );
}
