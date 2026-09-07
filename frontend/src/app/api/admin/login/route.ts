import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, message: "La contraseña es requerida" },
        { status: 400 }
      );
    }

    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        message: "Autenticación exitosa",
      });
    }

    return NextResponse.json(
      { success: false, message: "Contraseña incorrecta" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
