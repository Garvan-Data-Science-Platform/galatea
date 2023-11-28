FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json .

RUN yarn

COPY . .

CMD [ "yarn", "vite", "--host"]