FROM node:20-alpine

WORKDIR /app


COPY ./package.json ./package.json
COPY ./pnpm-lock.yaml ./pnpm-lock.yaml

RUN npm install
RUN npm install -g pnpm 

COPY . . 

EXPOSE 8000

CMD ["pnpm","dev"]