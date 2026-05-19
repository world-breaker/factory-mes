import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayTotal, todayPass, todayFail, weekTotal, weekFail] = await Promise.all([
    prisma.qualityRecord.count({ where: { createdAt: { gte: today } } }),
    prisma.qualityRecord.count({ where: { createdAt: { gte: today }, result: "pass" } }),
    prisma.qualityRecord.count({ where: { createdAt: { gte: today }, result: "fail" } }),
    prisma.qualityRecord.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.qualityRecord.count({ where: { createdAt: { gte: sevenDaysAgo }, result: "fail" } }),
  ]);

  return NextResponse.json({
    todayTotal,
    todayPass,
    todayFail,
    weekTotal,
    weekFail,
    passRate: todayTotal > 0 ? Math.round((todayPass / todayTotal) * 100) : 100,
  });
}
