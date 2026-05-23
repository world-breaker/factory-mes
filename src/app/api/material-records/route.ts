import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/material-records?type=in|out
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  const where: any = {};
  if (type === "in" || type === "out") where.type = type;

  const records = await prisma.materialRecord.findMany({
    where,
    include: {
      material: { select: { id: true, name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(records);
}
