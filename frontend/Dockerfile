FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 建置時帶入後端 WS URL
ARG VITE_WS_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# 用 nginx 來 serve 靜態檔案
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx 設定，處理 Vue Router 的 history mode
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]