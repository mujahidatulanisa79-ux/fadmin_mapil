import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const products = await query<any[]>(
      "SELECT * FROM products WHERE id = ? LIMIT 1",
      [id]
    );

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: products[0] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      values.push(body.name.trim());
    }
    if (body.sku !== undefined) {
      updates.push("sku = ?");
      values.push(body.sku.trim());
    }
    if (body.category !== undefined) {
      updates.push("category = ?");
      values.push(body.category);
    }
    if (body.color !== undefined) {
      updates.push("color = ?");
      values.push(body.color);
    }
    if (body.size !== undefined) {
      updates.push("size = ?");
      values.push(body.size);
    }
    if (body.price !== undefined) {
      updates.push("price = ?");
      values.push(Number(body.price));
    }
    if (body.stock !== undefined) {
      updates.push("stock = ?");
      values.push(Number(body.stock));
    }
    if (body.minimum !== undefined) {
      updates.push("minimum = ?");
      values.push(Number(body.minimum));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada data yang diperbarui" },
        { status: 400 }
      );
    }

    values.push(id);
    const sql = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
    await query(sql, values);

    return NextResponse.json({
      success: true,
      message: "Produk berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Update product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.code === "ER_DUP_ENTRY" ? "Kode SKU sudah digunakan" : error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query("DELETE FROM products WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
