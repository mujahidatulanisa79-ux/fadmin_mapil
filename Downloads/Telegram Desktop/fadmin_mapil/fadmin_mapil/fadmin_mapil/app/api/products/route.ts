import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const lowStock = searchParams.get("lowStock") === "true";
    const status = searchParams.get("status") || "";

    let sql = `
      SELECT 
        id, 
        name, 
        sku, 
        category, 
        color, 
        size, 
        CAST(price AS DOUBLE) AS price, 
        stock, 
        minimum, 
        created_at, 
        updated_at 
      FROM products 
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (category && category !== "Semua Kategori") {
      sql += " AND category = ?";
      params.push(category);
    }

    if (search.trim()) {
      sql += " AND (name LIKE ? OR sku LIKE ? OR category LIKE ? OR color LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (lowStock) {
      sql += " AND stock <= minimum";
    }

    if (status === "Stok Habis") {
      sql += " AND stock = 0";
    } else if (status === "Stok Menipis") {
      sql += " AND stock > 0 AND stock <= minimum";
    } else if (status === "Tersedia") {
      sql += " AND stock > minimum";
    }

    sql += " ORDER BY id DESC";

    const products = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error("Database query error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil data produk dari database",
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      category,
      price,
      stock,
      color = "Hitam",
      size = "M",
      minimum = 10,
    } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nama produk wajib diisi" },
        { status: 400 }
      );
    }

    const finalSku = sku && sku.trim() !== "" ? sku.trim() : `FS-${Date.now().toString().slice(-5)}`;
    const finalPrice = Number(price) >= 0 ? Number(price) : 0;
    const finalStock = Number(stock) >= 0 ? Number(stock) : 0;
    const finalMinimum = Number(minimum) >= 0 ? Number(minimum) : 10;
    const finalCategory = category || "Kaos";

    const insertSql = `
      INSERT INTO products (name, sku, category, color, size, price, stock, minimum)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query<any>(insertSql, [
      name.trim(),
      finalSku,
      finalCategory,
      color,
      size,
      finalPrice,
      finalStock,
      finalMinimum,
    ]);

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: "Produk berhasil ditambahkan",
    });
  } catch (error: any) {
    console.error("Insert product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.code === "ER_DUP_ENTRY" ? "Kode SKU sudah digunakan" : error.message,
      },
      { status: 500 }
    );
  }
}
