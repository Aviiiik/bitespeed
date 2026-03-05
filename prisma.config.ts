// prisma.config.ts (New file for Prisma 7)

import "dotenv/config";  // Loads .env vars
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),  // Your Render Postgres URL from .env
  },
});