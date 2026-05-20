import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const recordId = parseInt(id);

  const record = await prisma.materialRecord.findUnique({
    where: { id: recordId },
  });
  if (!record) {
    return NextResponse.json({ error: "出入库记录不存在" }, { status: 404 });
  }

  await prisma.materialRecord.delete({ where: { id: recordId } });

  return NextResponse.json({ success: true });
}
