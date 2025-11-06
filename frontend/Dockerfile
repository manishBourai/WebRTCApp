FROM node:20-alpine
WORKDIR /app
COPY ./package*.json ./
COPY ./pnpm-lock.yaml ./
RUN npm i -g pnpm 
RUN pnpm i 
COPY . .
EXPOSE 5173
CMD ["pnpm","dev"]