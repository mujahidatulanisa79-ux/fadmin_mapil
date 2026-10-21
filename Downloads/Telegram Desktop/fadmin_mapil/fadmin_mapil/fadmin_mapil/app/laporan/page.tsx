"use client";

import { useMemo, useState, useEffect, useCallback } from "react";

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  minimum?: number;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

export default function LaporanPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua Kategori");
  const [status, setStatus] = useState("Semua Status");
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setDbError(null);
      const res = await fetch("/api/products");
      const result = await res.json();
      if (result.success) {
        setProducts(result.data);
      } else {
        setDbError(result.error || "Gagal mengambil data produk");
      }
    } catch (err: any) {
      setDbError(err.message || "Gagal menghubungi database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const totalStock = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
  const lowStock = products.filter(
    (product) => (Number(product.stock) || 0) > 0 && (Number(product.stock) || 0) <= (product.minimum ?? 10)
  ).length;
  const outOfStock = products.filter((product) => (Number(product.stock) || 0) === 0).length;
  const inventoryValue = products.reduce(
    (sum, product) => sum + (Number(product.stock) || 0) * (Number(product.price) || 0),
    0
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = `${product.name} ${product.sku} ${product.category}`
          .toLowerCase()
          .includes(search.toLowerCase());

        const matchesCategory =
          category === "Semua Kategori" || product.category === category;

        const isOut = (Number(product.stock) || 0) === 0;
        const isLow = (Number(product.stock) || 0) <= (product.minimum ?? 10);
        const productStatus = isOut
          ? "Stok Habis"
          : isLow
            ? "Stok Menipis"
            : "Tersedia";

        const matchesStatus = status === "Semua Status" || productStatus === status;

        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [products, search, category, status]
  );

  function downloadCSV() {
    const headers = ["SKU", "Nama Produk", "Kategori", "Harga", "Stok", "Nilai Stok", "Status"];
    const rows = filteredProducts.map((product) => {
      const isOut = (Number(product.stock) || 0) === 0;
      const isLow = (Number(product.stock) || 0) <= (product.minimum ?? 10);
      const productStatus = isOut
        ? "Stok Habis"
        : isLow
          ? "Stok Menipis"
          : "Tersedia";

      return [
        product.sku || `FS-${product.id}`,
        product.name,
        product.category,
        product.price,
        product.stock,
        (Number(product.price) || 0) * (Number(product.stock) || 0),
        productStatus,
      ];
    });

    const escapeCSV = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `laporan-inventaris-fashion-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] flex-col bg-[#171a2b] text-white md:flex">
        <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-xl">
            ✦
          </div>
          <div>
            <h1 className="font-bold tracking-wide">FASHIONLY</h1>
            <p className="text-[10px] tracking-[3px] text-slate-400">
              ADMIN PANEL
            </p>
          </div>
        </div>

        <nav className="space-y-2 p-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[2px] text-slate-500">
            MENU UTAMA
          </p>
          <a href="/" className="block rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
            ▦　Dashboard
          </a>
          <a href="/produk" className="block rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
            ♧　Data Produk
          </a>
          <a href="/kategori" className="block rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
            ▤　Kategori
          </a>
          <a href="/stok-menipis" className="block rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
            ♧　Stok Menipis
          </a>
          <a href="/laporan" className="block rounded-xl border border-violet-400/20 bg-violet-500/15 px-4 py-3 text-sm font-medium text-violet-300">
            ▥　Laporan
          </a>
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-sm font-semibold">Admin Fashion</p>
            <p className="mt-1 text-xs text-slate-400">MySQL Database</p>
            <p className="mt-3 text-xs text-emerald-400">● Sistem aktif</p>
          </div>
        </div>
      </aside>

      {/* KONTEN */}
      <main className="min-w-0 md:ml-[250px]">
        <header className="flex min-h-[82px] items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs text-slate-400">Fashionly / Analisis</p>
            <h2 className="mt-1 text-xl font-bold">Laporan Inventaris</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
            A
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8">
          {dbError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Database Error:</strong> {dbError}
            </div>
          )}

          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-600">
                Ringkasan Inventaris
              </span>
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                Laporan Produk
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Pantau persediaan dan nilai stok produk fashion langsung dari database MySQL.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProducts()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                ↻ Refresh
              </button>
              <button
                onClick={downloadCSV}
                className="rounded-xl bg-[#6d55df] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#5940ca]"
              >
                ↓ Unduh Laporan CSV
              </button>
            </div>
          </section>

          {/* KARTU RINGKASAN */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Produk</p>
              <p className="mt-3 text-3xl font-bold">{products.length}</p>
              <p className="mt-2 text-xs text-slate-400">Jenis produk terdaftar di DB</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Unit Stok</p>
              <p className="mt-3 text-3xl font-bold text-blue-600">{totalStock}</p>
              <p className="mt-2 text-xs text-slate-400">Seluruh unit persediaan</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Stok Menipis</p>
              <p className="mt-3 text-3xl font-bold text-amber-600">{lowStock}</p>
              <p className="mt-2 text-xs text-slate-400">Perlu dipantau</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Nilai Inventaris</p>
              <p className="mt-3 text-xl font-bold text-emerald-600">
                {formatPrice(inventoryValue)}
              </p>
              <p className="mt-2 text-xs text-slate-400">Perkiraan nilai stok tersisa</p>
            </div>
          </section>

          {/* PERINGATAN */}
          {outOfStock > 0 && (
            <section className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-xl text-rose-600">
                !
              </div>
              <div>
                <h3 className="font-bold text-rose-800">Perhatian stok habis</h3>
                <p className="mt-1 text-sm text-rose-700">
                  Ada {outOfStock} produk dengan stok nol di database. Periksa laporan sebelum melakukan pengadaan.
                </p>
              </div>
            </section>
          )}

          {/* TABEL LAPORAN */}
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <h3 className="text-lg font-bold">Detail Laporan Inventaris</h3>
              <p className="mt-1 text-sm text-slate-500">
                Gunakan filter untuk melihat kondisi produk tertentu di database MySQL.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama produk atau SKU..."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400"
                />

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400"
                >
                  <option>Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400"
                >
                  <option>Semua Status</option>
                  <option>Tersedia</option>
                  <option>Stok Menipis</option>
                  <option>Stok Habis</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-sm text-slate-400">
                  Memuat data laporan...
                </div>
              ) : (
                <table className="w-full min-w-[750px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Produk</th>
                      <th className="px-5 py-4">SKU</th>
                      <th className="px-5 py-4">Kategori</th>
                      <th className="px-5 py-4">Harga</th>
                      <th className="px-5 py-4">Stok</th>
                      <th className="px-5 py-4">Nilai Stok</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product) => {
                      const isOut = (Number(product.stock) || 0) === 0;
                      const isLow = (Number(product.stock) || 0) <= (product.minimum ?? 10);
                      return (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="px-6 py-5 font-semibold">{product.name}</td>
                          <td className="px-5 py-5 font-mono text-xs text-slate-500">
                            {product.sku || `FS-${product.id}`}
                          </td>
                          <td className="px-5 py-5 text-sm">{product.category}</td>
                          <td className="whitespace-nowrap px-5 py-5 text-sm">{formatPrice(product.price)}</td>
                          <td className="px-5 py-5 text-sm">{product.stock} unit</td>
                          <td className="whitespace-nowrap px-5 py-5 text-sm font-medium">
                            {formatPrice((Number(product.price) || 0) * (Number(product.stock) || 0))}
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                                isOut
                                  ? "bg-rose-50 text-rose-600"
                                  : isLow
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {isOut ? "Stok Habis" : isLow ? "Stok Menipis" : "Tersedia"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                          {products.length === 0
                            ? "Belum ada produk di database. Silakan tambahkan produk terlebih dahulu."
                            : "Tidak ada data yang sesuai dengan filter."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
              Menampilkan {filteredProducts.length} dari {products.length} produk di database.
            </div>
          </section>

          <footer className="pb-3 text-center text-xs text-slate-400">
            © 2026 Fashionly Admin Dashboard
          </footer>
        </div>
      </main>
    </div>
  );
}
