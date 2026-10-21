"use client";

import { useState, useEffect, useCallback } from "react";

type Category = {
  id: number;
  name: string;
  description: string;
  icon?: string;
  count?: number;
};

export default function KategoriPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setDbError(null);
      const res = await fetch("/api/categories");
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      } else {
        setDbError(result.error || "Gagal mengambil data kategori");
      }
    } catch (err: any) {
      setDbError(err.message || "Gagal terhubung ke database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function addCategory() {
    const name = window.prompt("Masukkan nama kategori:");
    if (!name?.trim()) return;

    if (
      categories.some(
        (category) => category.name.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      window.alert("Kategori tersebut sudah ada.");
      return;
    }

    const description =
      window.prompt("Masukkan deskripsi kategori:") || "Kategori fashion";

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          icon: "📦",
        }),
      });

      const result = await res.json();
      if (!result.success) {
        window.alert(`Gagal menambah kategori: ${result.error}`);
        return;
      }

      await fetchCategories();
    } catch (err: any) {
      window.alert(`Terjadi error: ${err.message}`);
    }
  }

  async function deleteCategory(id: number) {
    const confirmed = window.confirm("Yakin ingin menghapus kategori ini dari database?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!result.success) {
        window.alert(`Gagal menghapus kategori: ${result.error}`);
        return;
      }
      await fetchCategories();
    } catch (err: any) {
      window.alert(`Terjadi error: ${err.message}`);
    }
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
        <div>
          <p className="text-xs text-slate-400">Fashionly / Inventaris</p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">
            Manajemen Kategori
          </h1>
        </div>
        <a
          href="/"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Dashboard
        </a>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        {dbError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>Database Error:</strong> {dbError}
          </div>
        )}

        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Kategori Produk</h2>
            <p className="mt-2 text-sm text-slate-500">
              Kelola kategori untuk mengelompokkan produk fashion di database MySQL.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchCategories()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              ↻ Refresh
            </button>
            <button
              onClick={addCategory}
              className="rounded-xl bg-[#6d55df] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5940ca]"
            >
              + Tambah Kategori
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Kategori</p>
            <p className="mt-3 text-3xl font-bold">{categories.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Kategori Fashion</p>
            <p className="mt-3 text-3xl font-bold text-violet-600">
              {categories.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Status Database</p>
            <p className="mt-3 text-xl font-bold text-emerald-600">
              ● MySQL Terhubung
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h3 className="text-lg font-bold">Daftar Kategori</h3>
            <p className="mt-1 text-sm text-slate-500">
              Cari, tambah, dan hapus kategori produk di database.
            </p>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama kategori..."
              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 sm:max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Memuat data kategori...
              </div>
            ) : (
              <table className="w-full min-w-[500px] text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Nama Kategori</th>
                    <th className="px-6 py-4">Deskripsi</th>
                    <th className="px-6 py-4">Jumlah Produk</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50">
                      <td className="px-6 py-5 font-semibold">
                        <span className="mr-2">{category.icon || "📦"}</span>
                        {category.name}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">
                        {category.description || "-"}
                      </td>
                      <td className="px-6 py-5">
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          {category.count ?? 0} produk
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCategories.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-sm text-slate-400"
                      >
                        {categories.length === 0
                          ? "Belum ada kategori di database. Silakan klik '+ Tambah Kategori'."
                          : "Kategori tidak ditemukan."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
