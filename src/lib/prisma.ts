import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // 构建时不需要真正连接数据库，返回空代理避免报错
  if (!process.env.DATABASE_URL) {
    return new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (prop === "$connect" || prop === "$disconnect" || prop === "$on" || prop === "$use" || prop === "$extends") {
          return () => Promise.resolve();
        }
        return () => {
          console.warn("PrismaClient not available during build");
          return Promise.resolve([]);
        };
      },
    });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
