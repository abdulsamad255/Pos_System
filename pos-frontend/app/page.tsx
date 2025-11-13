// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-700">
        Welcome to your POS system. Use the navigation to manage products or
        run sales.
      </p>
      <div className="flex gap-3">
  <Link
    href="/pos"
    className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
  >
    Open POS
  </Link>
  <Link
    href="/products"
    className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100"
  >
    View Products
  </Link>
  <Link
    href="/login"
    className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100"
  >
    Login
  </Link>
</div>

    </div>
  );
}
