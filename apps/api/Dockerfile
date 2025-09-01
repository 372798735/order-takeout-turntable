FROM node:20-alpine

WORKDIR /app

# 仅拷贝必要文件，优化缓存
COPY package*.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm ci \
    && npm run prisma:generate \
    && npm run build \
    && npm prune --production

ENV NODE_ENV=production
EXPOSE 3001

# 启动前执行幂等迁移
CMD ["sh","-c","npx prisma migrate deploy && node dist/main.js"]


