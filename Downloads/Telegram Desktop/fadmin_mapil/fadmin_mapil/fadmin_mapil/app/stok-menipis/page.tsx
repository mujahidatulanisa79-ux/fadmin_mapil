"use client";

import { useMemo, useState, useEffect, useCallback } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  minimum: number;
  price: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function StokMenipisPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua Kategori");
  const [notice, setNotice] = useState("");
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

  const lowStockProducts = useMemo(
    () => products.filter((product) => (Number(product.stock) || 0) <= (product.minimum ?? 10)),
    [products]
  );

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = lowStockProducts.filter((product) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      (product.name || "").toLowerCase().includes(keyword) ||
      (product.sku || "").toLowerCase().includes(keyword) ||
      (product.category || "").toLowerCase().includes(keyword);

    const matchesCategory =
      category === "Semua Kategori" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  const totalUnits = lowStockProducts.reduce(
    (total, product) => total + (Number(product.stock) || 0),
    0
  );

  const outOfStock = lowStockProducts.filter(
    (product) => (Number(product.stock) || 0) === 0
  ).length;

  const handleUpdateStock = async (product: Product) => {
    const answer = window.prompt(
      `Masukkan jumlah stok baru untuk ${product.name}:`,
      String(product.stock)
    );

    if (answer === null || answer.trim() === "") return;

    const newStock = Number(answer);

    if (!Number.isInteger(newStock) || newStock < 0) {
      window.alert("Stok harus berupa angka bulat dan tidak boleh negatif.");
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      const result = await res.json();
      if (!result.success) {
        window.alert(`Gagal memperbarui stok: ${result.error}`);
        return;
      }

      setNotice(`Stok ${product.name} berhasil diperbarui menjadi ${newStock}.`);
      window.setTimeout(() => setNotice(""), 3500);
      await fetchProducts();
    } catch (err: any) {
      window.alert(`Terjadi error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-[250px] shrink-0 flex-col bg-[#171a2b] text-white md:flex">
          <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-xl">
              ✦
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">FASHIONLY</h1>
              <p className="text-[10px] tracking-[3px] text-slate-400">
                ADMIN PANEL
              </p>
            </div>
          </div>

          <div className="px-4 pt-7">
            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[2px] text-slate-500">
              MENU UTAMA
            </p>

            <nav className="space-y-2">
              <a
                href="/"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <span className="text-lg">▦</span>
                Dashboard
              </a>

              <a
                href="/produk"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <span className="text-lg">♧</span>
                Data Produk
              </a>

              <a
                href="/kategori"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <span className="text-lg">▤</span>
                Kategori
              </a>

              <a
                href="/stok-menipis"
                className="flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-500/15 px-4 py-3 text-sm font-medium text-violet-300"
              >
                <span className="text-lg">♧</span>
                Stok Menipis
                <span className="ml-auto rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {lowStockProducts.length}
                </span>
              </a>

              <a
                href="/laporan"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <span className="text-lg">▥</span>
                Laporan
              </a>
            </nav>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">
                  A
                </div>
                <div>
                  <p className="text-sm font-semibold">Admin Fashion</p>
                  <p className="text-xs text-slate-400">MySQL Database</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Sistem aktif
              </div>
            </div>
          </div>
        </aside>

        {/* KONTEN UTAMA */}
        <main className="min-w-0 flex-1">
          {/* TOPBAR */}
          <header className="flex min-h-[82px] flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div>
              <div className="text-xs text-slate-400">
                Fashionly <span className="mx-2">/</span> Inventaris
              </div>
              <h2 className="mt-1 text-lg font-bold sm:text-xl">
                Manajemen Stok
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">Admin Fashion</p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
                A
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8">
            {dbError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Database Error:</strong> {dbError}
              </div>
            )}

            {/* JUDUL HALAMAN */}
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                  Perhatian: Inventaris MySQL
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Stok Menipis
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Pantau produk yang stoknya mencapai batas minimum agar
                  persediaan fashion tetap tersedia.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => fetchProducts()}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  ↻ Refresh
                </button>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("Semua Kategori");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  Reset Filter
                </button>
              </div>
            </section>

            {/* NOTIFIKASI */}
            {notice && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                ✓ {notice}
              </div>
            )}

            {/* KARTU RINGKASAN */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Produk Stok Menipis
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-slate-900">
                      {lowStockProducts.length}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400">
                      Produk perlu diperiksa
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-600">
                    !
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total Sisa Stok
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-slate-900">
                      {totalUnits}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400">
                      Unit pada produk terpilih
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                    ▤
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Stok Habis
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-slate-900">
                      {outOfStock}
                    </h3>
                    <p className="mt-2 text-xs text-rose-500">
                      Perlu segera diisi
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-xl text-rose-600">
                    ×
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Estimasi Nilai Stok
                    </p>
                    <h3 className="mt-3 text-2xl font-bold text-slate-900">
                      {money(
                        lowStockProducts.reduce(
                          (total, product) =>
                            total + (Number(product.stock) || 0) * (Number(product.price) || 0),
                          0
                        )
                      )}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400">
                      Nilai berdasarkan stok tersisa
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
                    Rp
                  </div>
                </div>
              </div>
            </section>

            {/* PERINGATAN */}
            <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl text-amber-700">
                ⚠
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900">
                  Perlu perhatian pada persediaan
                </h3>
                <p className="mt-1 text-sm leading-6 text-amber-800/80">
                  Ada {lowStockProducts.length} produk yang berada pada atau di
                  bawah batas stok minimum. Perbarui stok agar produk siap
                  dijual kembali.
                </p>
              </div>
              <span className="w-fit rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700">
                {outOfStock} produk habis
              </span>
            </section>

            {/* TABEL INVENTARIS */}
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Daftar Inventaris
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Daftar produk yang membutuhkan perhatian stok.
                  </p>
                </div>

                <span className="w-fit rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                  {filteredProducts.length} produk ditemukan
                </span>
              </div>

              {/* FILTER */}
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:p-6">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    ⌕
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari nama produk, SKU, atau kategori..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option>Semua Kategori</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* TABEL */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center text-sm text-slate-400">
                    Memuat data inventaris...
                  </div>
                ) : (
                  <table className="w-full min-w-[850px] border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-4 font-semibold">Produk</th>
                        <th className="px-5 py-4 font-semibold">SKU</th>
                        <th className="px-5 py-4 font-semibold">Kategori</th>
                        <th className="px-5 py-4 font-semibold">Variasi</th>
                        <th className="px-5 py-4 font-semibold">Stok</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 text-right font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((product) => {
                        const isEmpty = (Number(product.stock) || 0) === 0;
                        const min = product.minimum ?? 10;
                        const percentage = Math.min(
                          100,
                          Math.round(((Number(product.stock) || 0) / (min || 1)) * 100)
                        );

                        return (
                          <tr
                            key={product.id}
                            className="transition hover:bg-slate-50/80"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0edff] text-lg text-violet-600">
                                  ♧
                                </div>
                                <div>
                                  <p className="max-w-[210px] font-semibold text-slate-800">
                                    {product.name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {money(product.price)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5">
                              <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                                {product.sku || `FS-${product.id}`}
                              </span>
                            </td>

                            <td className="px-5 py-5 text-sm text-slate-600">
                              {product.category}
                            </td>

                            <td className="px-5 py-5">
                              <p className="text-sm text-slate-700">
                                {product.color || "Standar"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Ukuran {product.size || "M"}
                              </p>
                            </td>

                            <td className="px-5 py-5">
                              <div className="w-[110px]">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <span
                                    className={`text-sm font-bold ${
                                      isEmpty ? "text-rose-600" : "text-amber-600"
                                    }`}
                                  >
                                    {product.stock} unit
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    / {min}
                                  </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className={`h-full rounded-full ${
                                      isEmpty ? "bg-rose-500" : "bg-amber-400"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5">
                              <span
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
                                  isEmpty
                                    ? "bg-rose-50 text-rose-600"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isEmpty ? "bg-rose-500" : "bg-amber-500"
                                  }`}
                                />
                                {isEmpty ? "Stok Habis" : "Stok Menipis"}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-right">
                              <button
                                onClick={() => handleUpdateStock(product)}
                                className="whitespace-nowrap rounded-lg bg-[#6d55df] px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5940ca] hover:shadow-md active:scale-[0.98]"
                              >
                                ↻ Perbarui Stok
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-14 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
                              ⌕
                            </div>
                            <p className="font-semibold text-slate-700">
                              {lowStockProducts.length === 0
                                ? "Semua stok produk dalam kondisi aman!"
                                : "Produk tidak ditemukan"}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              {lowStockProducts.length === 0
                                ? "Tidak ada produk yang berada di bawah batas minimum."
                                : "Coba gunakan kata kunci atau kategori lain."}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:flex-row sm:items-center">
                <p>Menampilkan {filteredProducts.length} produk stok menipis</p>
                <p>Fashionly Inventory Management</p>
              </div>
            </section>

            <footer className="pb-3 text-center text-xs text-slate-400">
              © 2026 Fashionly Admin Dashboard · Kelola stok dengan mudah
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
