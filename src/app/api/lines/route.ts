import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const lines = await prisma.productionLine.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(lines);
}
