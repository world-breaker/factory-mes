import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 判断是否在 Edge Runtime 中
function isEdgeRuntime() {
  return typeof (globalThis as any).EdgeRuntime !== "undefined";
}

function createPrismaProxy() {
  return new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (prop === "$connect" || prop === "$disconnect" || prop === "$on" || prop === "$use" || prop === "$extends") {
        return () => Promise.resolve();
      }
      return () => {
        console.warn("PrismaClient not available (edge runtime or build)");
        return Promise.resolve([]);
      };
    },
  });
}

function createPrismaClient() {
  // Edge Runtime 不支持 PrismaClient（Node.js API）
  if (isEdgeRuntime()) {
    return createPrismaProxy();
  }

  // 无数据库连接时返回代理
  if (!process.env.DATABASE_URL) {
    return createPrismaProxy();
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
