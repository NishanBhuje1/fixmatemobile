import dotenv from "dotenv";
dotenv.config();

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: must("DATABASE_URL"),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean),
  JWT_SECRET: must("JWT_SECRET"),
  ADMIN_USERNAME: must("ADMIN_USERNAME"),
  ADMIN_PASSWORD: must("ADMIN_PASSWORD")
};
