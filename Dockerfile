FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm

ENV CI=true

RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE 5000

CMD ["pnpm", "dev"]