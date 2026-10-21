import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const summarySql = `
      SELECT 
        COUNT(*) AS totalProducts,
        COALESCE(SUM(stock), 0) AS totalStock,
        SUM(CASE WHEN stock <= minimum THEN 1 ELSE 0 END) AS lowStock,
        COUNT(DISTINCT category) AS categoryCount
      FROM products
    `;

    const summaryResult = await query<any[]>(summarySql);
    const summary = summaryResult[0] || {
      totalProducts: 0,
      totalStock: 0,
      lowStock: 0,
      categoryCount: 0,
    };

    const recentProducts = await query<any[]>(
      "SELECT id, name, sku, category, color, size, CAST(price AS DOUBLE) AS price, stock, minimum FROM products ORDER BY id DESC LIMIT 5"
    );

    const categories = await query<any[]>(`
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
    `);

    return NextResponse.json({
      success: true,
      data: {
        totalProducts: Number(summary.totalProducts || 0),
        totalStock: Number(summary.totalStock || 0),
        lowStock: Number(summary.lowStock || 0),
        categoryCount: Number(summary.categoryCount || 0),
        recentProducts,
        categories,
      },
    });
  } catch (error: any) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil data dashboard",
        data: {
          totalProducts: 0,
          totalStock: 0,
          lowStock: 0,
          categoryCount: 0,
          recentProducts: [],
          categories: [],
        },
      },
      { status: 500 }
    );
  }
}
