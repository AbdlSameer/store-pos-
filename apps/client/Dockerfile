FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/client/package.json ./apps/client/
RUN npm ci --legacy-peer-deps

COPY packages/shared ./packages/shared
COPY apps/client ./apps/client

RUN npx turbo run build --filter=@toystore/client...

FROM nginx:alpine AS runner
# Copy dist to nginx
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
# Default nginx config routes everything to index.html for SPA
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
