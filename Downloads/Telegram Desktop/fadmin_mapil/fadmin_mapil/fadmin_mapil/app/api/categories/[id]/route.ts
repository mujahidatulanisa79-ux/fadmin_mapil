import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query("DELETE FROM categories WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
