FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm

COPY . .

ENV CI=true

RUN pnpm install

RUN pnpm build

EXPOSE 5000

CMD ["pnpm", "dev"]