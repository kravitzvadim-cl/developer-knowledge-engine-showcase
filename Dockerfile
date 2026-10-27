# API image. `npm run ingest` bakes the index and both local models in, so start-up downloads nothing.
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run ingest
ENV PORT=7860
EXPOSE 7860
CMD ["npx", "tsx", "src/server.ts"]
