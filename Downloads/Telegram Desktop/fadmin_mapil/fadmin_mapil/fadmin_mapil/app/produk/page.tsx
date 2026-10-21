"use client";

import { useState, useEffect, useCallback } from "react";

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

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
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

  async function addProduct() {
    const name = window.prompt("Nama produk:");
    if (!name?.trim()) return;

    const sku = window.prompt("Kode SKU:", `FS-${Date.now().toString().slice(-5)}`);
    if (!sku?.trim()) return;

    const category = window.prompt(
      "Kategori produk (Atasan, Celana, Rok, Dress, Outerwear):",
      "Atasan"
    );
    if (!category?.trim()) return;

    const priceText = window.prompt("Harga produk (angka saja):", "100000");
    if (priceText === null || priceText.trim() === "") return;

    const stockText = window.prompt("Jumlah stok:", "10");
    if (stockText === null || stockText.trim() === "") return;

    const price = Number(priceText);
    const stock = Number(stockText);

    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      window.alert("Harga harus angka positif dan stok harus bilangan bulat nonnegatif.");
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          category: category.trim(),
          price,
          stock,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        window.alert(`Gagal menambah produk: ${result.error}`);
        return;
      }
      await fetchProducts();
    } catch (err: any) {
      window.alert(`Terjadi error: ${err.message}`);
    }
  }

  async function editProduct(product: Product) {
    const name = window.prompt("Nama produk:", product.name);
    if (name === null || !name.trim()) return;

    const priceText = window.prompt("Harga produk:", String(product.price));
    if (priceText === null || priceText.trim() === "") return;

    const stockText = window.prompt("Jumlah stok:", String(product.stock));
    if (stockText === null || stockText.trim() === "") return;

    const price = Number(priceText);
    const stock = Number(stockText);

    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      window.alert("Harga harus angka positif dan stok harus bilangan bulat nonnegatif.");
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price,
          stock,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        window.alert(`Gagal mengedit produk: ${result.error}`);
        return;
      }
      await fetchProducts();
    } catch (err: any) {
      window.alert(`Terjadi error: ${err.message}`);
    }
  }

  async function deleteProduct(id: number) {
    if (!window.confirm("Yakin ingin menghapus produk ini dari database?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!result.success) {
        window.alert(`Gagal menghapus produk: ${result.error}`);
        return;
      }
      await fetchProducts();
    } catch (err: any) {
      window.alert(`Terjadi error: ${err.message}`);
    }
  }

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.sku} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalStock = products.reduce((total, product) => total + (Number(product.stock) || 0), 0);
  const lowStock = products.filter((product) => (Number(product.stock) || 0) <= (product.minimum ?? 10)).length;

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] flex-col bg-[#171a2b] text-white md:flex">
        <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-xl">✦</div>
          <div>
            <h1 className="font-bold tracking-wide">FASHIONLY</h1>
            <p className="text-[10px] tracking-[3px] text-slate-400">ADMIN PANEL</p>
          </div>
        </div>

        <nav className="space-y-2 p-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[2px] text-slate-500">MENU UTAMA</p>
          <a href="/" className="flex rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">▦　Dashboard</a>
          <a href="/produk" className="flex rounded-xl border border-violet-400/20 bg-violet-500/15 px-4 py-3 text-sm font-medium text-violet-300">♧　Data Produk</a>
          <a href="/kategori" className="flex rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">▤　Kategori</a>
          <a href="/stok-menipis" className="flex rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">♧　Stok Menipis</a>
          <a href="/laporan" className="flex rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">▥　Laporan</a>
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-sm font-semibold">Admin Fashion</p>
            <p className="mt-1 text-xs text-slate-400">MySQL Database</p>
            <p className="mt-3 text-xs text-emerald-400">● Sistem aktif</p>
          </div>
        </div>
      </aside>

      <main className="min-w-0 md:ml-[250px]">
        <header className="flex min-h-[82px] items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs text-slate-400">Fashionly / Inventaris</p>
            <h2 className="mt-1 text-xl font-bold">Manajemen Produk</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">A</div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8">
          {dbError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Database Error:</strong> {dbError}
            </div>
          )}

          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Data Produk</h1>
              <p className="mt-2 text-sm text-slate-500">
                Kelola seluruh produk fashion di toko kamu langsung dari database MySQL.
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
                onClick={addProduct}
                className="rounded-xl bg-[#6d55df] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5940ca]"
              >
                + Tambah Produk
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Produk</p>
              <p className="mt-3 text-3xl font-bold">{products.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Stok</p>
              <p className="mt-3 text-3xl font-bold text-blue-600">{totalStock}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Stok Menipis (10 atau kurang)</p>
              <p className="mt-3 text-3xl font-bold text-amber-600">{lowStock}</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <h3 className="text-lg font-bold">Daftar Produk</h3>
              <p className="mt-1 text-sm text-slate-500">Cari, tambah, edit, dan hapus produk di MySQL.</p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama produk, SKU, atau kategori..."
                className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 sm:max-w-md"
              />
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-sm text-slate-400">Memuat data produk...</div>
              ) : (
                <table className="w-full min-w-[750px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Nama Produk</th>
                      <th className="px-5 py-4">SKU</th>
                      <th className="px-5 py-4">Kategori</th>
                      <th className="px-5 py-4">Harga</th>
                      <th className="px-5 py-4">Stok</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product) => {
                      const isLow = product.stock <= (product.minimum ?? 10);
                      return (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="px-6 py-5">
                            <p className="font-semibold">{product.name}</p>
                          </td>
                          <td className="px-5 py-5">
                            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs">{product.sku}</span>
                          </td>
                          <td className="px-5 py-5 text-sm">{product.category}</td>
                          <td className="whitespace-nowrap px-5 py-5 text-sm">{formatPrice(product.price)}</td>
                          <td className="px-5 py-5">
                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                product.stock === 0
                                  ? "bg-rose-50 text-rose-600"
                                  : isLow
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {product.stock === 0
                                ? "Stok Habis"
                                : isLow
                                  ? `${product.stock} unit · Menipis`
                                  : `${product.stock} unit`}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => editProduct(product)}
                                className="rounded-lg border border-violet-100 px-3 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteProduct(product.id)}
                                className="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                          {products.length === 0
                            ? "Belum ada produk di database. Silakan klik '+ Tambah Produk'."
                            : "Produk tidak ditemukan."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
              Menampilkan {filteredProducts.length} produk
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
