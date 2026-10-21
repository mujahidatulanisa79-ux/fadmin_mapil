import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.icon,
        COUNT(p.id) AS count
      FROM categories c
      LEFT JOIN products p ON c.name = p.category
      GROUP BY c.id, c.name, c.description, c.icon
      ORDER BY c.name ASC
    `;
    const categories = await query<any[]>(sql);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error("Fetch categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil kategori dari database",
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description = "Kategori fashion", icon = "📦" } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama kategori wajib diisi" },
        { status: 400 }
      );
    }

    const insertSql = `
      INSERT INTO categories (name, description, icon)
      VALUES (?, ?, ?)
    `;

    const result = await query<any>(insertSql, [
      name.trim(),
      description.trim() || "Kategori fashion",
      icon || "📦",
    ]);

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: "Kategori berhasil ditambahkan",
    });
  } catch (error: any) {
    console.error("Insert category error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.code === "ER_DUP_ENTRY" ? "Kategori tersebut sudah ada" : error.message,
      },
      { status: 500 }
    );
  }
}
