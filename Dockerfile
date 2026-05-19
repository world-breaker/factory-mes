# ============================================
# Factory MES - Dockerfile (备用部署方案)
# ============================================
# Railway 默认用 Nixpacks 构建，一般不需要 Dockerfile
# 如果 Nixpacks 构建有问题，启用此文件：
#   1. 在 Railway Dashboard → Settings → Build Command 选 Dockerfile
#   2. 或在项目根目录运行: railway add --dockerfile
#
# 注意：如需 Docker 部署，建议在 next.config.ts 中加 output: "standalone"

FROM node:20-alpine

WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate
RUN npx next build --webpack

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["bash", "startup.sh"]
