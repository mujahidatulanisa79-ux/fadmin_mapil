"use client";

import { useState, useEffect, useCallback } from "react";

type Product = {
  id: number;
  name: string;
  sku?: string;
  category: string;
  price: number;
  stock: number;
  status?: string;
  color?: string;
  minimum?: number;
};

type CategoryItem = {
  id?: number;
  name: string;
  icon?: string;
  count?: number;
  description?: string;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "Kaos",
    price: "",
    stock: "",
    color: "Hitam",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setDbError(null);

      const [resProducts, resCategories] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);

      const dataProducts = await resProducts.json();
      const dataCategories = await resCategories.json();

      if (dataProducts.success) {
        setProducts(dataProducts.data);
      } else {
        setDbError(dataProducts.error || "Gagal memuat produk dari database");
      }

      if (dataCategories.success) {
        setCategories(dataCategories.data);
      }
    } catch (err: any) {
      setDbError(err.message || "Gagal terhubung ke database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalStock = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
  const lowStock = products.filter((product) => (Number(product.stock) || 0) <= (product.minimum ?? 10)).length;
  const categoryCount = categories.length > 0 ? categories.length : new Set(products.map((p) => p.category)).size;

  const filteredProducts = products.filter((product) =>
    `${product.name || ""} ${product.category || ""} ${product.color || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function openAddForm() {
    setEditingId(null);
    setForm({ name: "", category: categories[0]?.name || "Kaos", price: "", stock: "", color: "Hitam" });
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      color: product.color || "Hitam",
    });
    setShowForm(true);
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!form.name.trim() || price < 0 || stock < 0 || !form.price || !form.stock) {
      alert("Isi semua data produk dengan benar.");
      return;
    }

    try {
      if (editingId !== null) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            category: form.category,
            price,
            stock,
            color: form.color,
          }),
        });
        const result = await res.json();
        if (!result.success) {
          alert(`Gagal memperbarui: ${result.error}`);
          return;
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            category: form.category,
            price,
            stock,
            color: form.color,
          }),
        });
        const result = await res.json();
        if (!result.success) {
          alert(`Gagal menambah produk: ${result.error}`);
          return;
        }
      }

      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    }
  }

  async function deleteProduct(id: number) {
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!result.success) {
        alert(`Gagal menghapus: ${result.error}`);
        return;
      }
      await fetchData();
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    }
  }

  const menuItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Produk", icon: "□" },
    { name: "Kategori", icon: "◈" },
    { name: "Pengaturan", icon: "⚙" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#242424] md:flex">
      <aside className="flex w-full flex-col bg-[#202020] px-5 py-6 text-white md:fixed md:inset-y-0 md:w-60">
        <div className="mb-9 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-black">F.</div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">FADMIN</h1>
            <p className="text-xs text-gray-400">Fashion Management</p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Menu Utama</p>
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveMenu(item.name)}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                activeMenu === item.name
                  ? "bg-white font-semibold text-[#202020]"
                  : "text-gray-300 hover:bg-white/10"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 md:mt-auto">
          <p className="text-sm font-semibold">Fashion Store</p>
          <p className="mt-1 text-xs leading-5 text-gray-400">Kelola produk dan pantau stok toko kamu dari MySQL.</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8 md:ml-60">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm text-gray-500">Fashion Store / {activeMenu}</p>
            <h2 className="text-2xl font-bold sm:text-3xl">
              {activeMenu === "Dashboard" ? "Dashboard Admin" : activeMenu}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Selamat datang kembali! Ini data real-time toko fashion kamu dari database.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              ↻ Refresh
            </button>
            <button
              onClick={openAddForm}
              className="rounded-xl bg-[#202020] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              + Tambah Produk
            </button>
          </div>
        </header>

        {dbError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>Peringatan Database:</strong> {dbError}. Pastikan Anda telah membuat tabel di DBeaver dan mengisi konfigurasi di <code>.env.local</code>.
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-gray-500">Memuat data dari database...</p>
          </div>
        ) : (
          <>
            {activeMenu === "Dashboard" && (
              <>
                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { title: "Total Produk", value: products.length, icon: "▤", note: "Produk terdaftar di DB" },
                    { title: "Total Stok", value: totalStock, icon: "▦", note: "Unit tersedia" },
                    { title: "Stok Menipis", value: lowStock, icon: "!", note: "Perlu diperiksa" },
                    { title: "Total Kategori", value: categoryCount, icon: "◈", note: "Kategori aktif" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{item.title}</p>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg font-bold">{item.icon}</span>
                      </div>
                      <p className="mt-4 text-3xl font-bold">{item.value.toLocaleString("id-ID")}</p>
                      <p className="mt-2 text-xs text-gray-500">{item.note}</p>
                    </div>
                  ))}
                </section>

                <section className="mb-8 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold">Ringkasan Inventaris</h3>
                        <p className="mt-1 text-sm text-gray-500">Kondisi stok produk saat ini</p>
                      </div>
                      <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold">Inventaris</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-[#f7f7f8] p-4">
                        <p className="text-sm text-gray-500">Stok tersedia</p>
                        <p className="mt-2 text-2xl font-bold">
                          {totalStock - products.filter((p) => p.stock <= (p.minimum ?? 10)).reduce((sum, p) => sum + p.stock, 0)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Unit dengan stok aman</p>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-4">
                        <p className="text-sm text-amber-800">Perlu perhatian</p>
                        <p className="mt-2 text-2xl font-bold text-amber-900">{lowStock} produk</p>
                        <p className="mt-1 text-xs text-amber-800">Stok di bawah batas minimum</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-gray-500">Produk dengan stok aman</span>
                        <span className="font-semibold">
                          {products.length ? Math.round(((products.length - lowStock) / products.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#292929] transition-all"
                          style={{ width: `${products.length ? ((products.length - lowStock) / products.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#252525] p-6 text-white shadow-sm">
                    <p className="text-sm text-gray-400">Koleksi pilihan</p>
                    <h3 className="mt-3 text-2xl font-bold leading-snug">Simple style,<br />everyday confidence.</h3>
                    <p className="mt-3 text-sm leading-6 text-gray-400">Kelola koleksi fashion kamu langsung terhubung ke MySQL database.</p>
                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                      <span className="text-sm text-gray-300">Jumlah produk tersimpan</span>
                      <span className="text-xl font-bold">{products.length}</span>
                    </div>
                  </div>
                </section>
              </>
            )}

            {activeMenu === "Kategori" && (
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category.id || category.name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <span className="text-3xl">{category.icon || "📦"}</span>
                      <h3 className="mt-4 font-bold">{category.name}</h3>
                      <p className="mt-2 text-sm text-gray-500">{category.count ?? 0} produk terkait</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500">
                    Belum ada kategori di database. Silakan jalankan query INSERT kategori di DBeaver atau tambahkan melalui menu Kategori.
                  </div>
                )}
              </section>
            )}

            {activeMenu === "Pengaturan" && (
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="font-bold">Pengaturan Database MySQL</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Aplikasi telah dikonfigurasi untuk terhubung ke MySQL Aiven melalui environment variable.
                </p>
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-xs font-mono text-gray-700">
                  <p>Host: {process.env.NEXT_PUBLIC_MYSQL_HOST || "Dikonfigurasi via .env"}</p>
                  <p>Database: {process.env.NEXT_PUBLIC_MYSQL_DATABASE || "defaultdb"}</p>
                  <p>Status: {products.length > 0 ? "Terhubung ke Database" : "Menunggu Data"}</p>
                </div>
              </section>
            )}

            {activeMenu === "Produk" && (
              <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">Daftar Produk</h3>
                    <p className="mt-1 text-sm text-gray-500">{products.length} produk terdaftar di database</p>
                  </div>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari nama, kategori, warna..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-500 sm:max-w-xs"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-4 font-medium">Nama Produk</th>
                        <th className="px-3 py-4 font-medium">Kategori</th>
                        <th className="px-3 py-4 font-medium">Warna</th>
                        <th className="px-3 py-4 font-medium">Harga</th>
                        <th className="px-3 py-4 font-medium">Stok</th>
                        <th className="px-3 py-4 font-medium">Status</th>
                        <th className="px-3 py-4 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const isLow = product.stock <= (product.minimum ?? 10);
                        return (
                          <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
                            <td className="px-3 py-4 font-semibold">{product.name}</td>
                            <td className="px-3 py-4 text-gray-600">{product.category}</td>
                            <td className="px-3 py-4 text-gray-600">{product.color || "-"}</td>
                            <td className="px-3 py-4">{formatPrice(product.price)}</td>
                            <td className="px-3 py-4">{product.stock}</td>
                            <td className="px-3 py-4">
                              <span
                                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                                  product.stock === 0
                                    ? "bg-rose-50 text-rose-700"
                                    : isLow
                                      ? "bg-amber-50 text-amber-800"
                                      : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {product.stock === 0 ? "Stok Habis" : isLow ? "Stok Menipis" : "Tersedia"}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => openEditForm(product)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs hover:bg-gray-100">
                                  Edit
                                </button>
                                <button onClick={() => deleteProduct(product.id)} className="rounded-lg border border-red-100 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-10 text-center text-gray-500">
                            {products.length === 0 ? "Belum ada produk di database. Tambahkan produk baru sekarang." : "Produk tidak ditemukan."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeMenu === "Dashboard" && (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">Produk Terbaru</h3>
                    <p className="mt-1 text-sm text-gray-500">Pantau produk dan kondisi stok toko dari database.</p>
                  </div>
                  <button onClick={() => setActiveMenu("Produk")} className="text-sm font-semibold underline underline-offset-4">
                    Lihat semua
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[550px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-4 font-medium">Produk</th>
                        <th className="px-3 py-4 font-medium">Kategori</th>
                        <th className="px-3 py-4 font-medium">Harga</th>
                        <th className="px-3 py-4 font-medium">Stok</th>
                        <th className="px-3 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 5).map((product) => {
                        const isLow = product.stock <= (product.minimum ?? 10);
                        return (
                          <tr key={product.id} className="border-b border-gray-50 last:border-0">
                            <td className="px-3 py-4 font-semibold">{product.name}</td>
                            <td className="px-3 py-4 text-gray-600">{product.category}</td>
                            <td className="px-3 py-4">{formatPrice(product.price)}</td>
                            <td className="px-3 py-4">{product.stock}</td>
                            <td className="px-3 py-4">
                              <span
                                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                                  product.stock === 0
                                    ? "bg-rose-50 text-rose-700"
                                    : isLow
                                      ? "bg-amber-50 text-amber-800"
                                      : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {product.stock === 0 ? "Stok Habis" : isLow ? "Stok Menipis" : "Tersedia"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                            Belum ada produk di database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        <footer className="py-6 text-center text-xs text-gray-400">
          © 2026 FAdmin · Fashion Store Management · MySQL Database Connected
        </footer>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form onSubmit={saveProduct} className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingId !== null ? "Edit Produk" : "Tambah Produk"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100">
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">
                Nama produk
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-gray-500"
                  placeholder="Contoh: Oversized Tee"
                />
              </label>
              <label className="text-sm font-medium">
                Kategori
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 font-normal"
                >
                  {categories.length > 0
                    ? categories.map((cat) => <option key={cat.name} value={cat.name}>{cat.name}</option>)
                    : ["Kaos", "Hoodie", "Celana", "Sweater", "Jaket", "Aksesori", "Lainnya"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Warna
                <select
                  value={form.color}
                  onChange={(event) => setForm({ ...form, color: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 font-normal"
                >
                  {["Hitam", "Putih", "Cream", "Biru", "Abu-abu", "Cokelat", "Merah", "Hijau"].map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Harga (Rp)
                <input
                  required
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal"
                  placeholder="125000"
                />
              </label>
              <label className="text-sm font-medium">
                Jumlah stok
                <input
                  required
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal"
                  placeholder="20"
                />
              </label>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#202020] px-5 py-3 text-sm font-semibold text-white hover:bg-black"
              >
                Simpan Produk
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
