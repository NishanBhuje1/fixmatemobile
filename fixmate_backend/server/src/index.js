import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./env.js";

import { authRouter } from "./routes/auth.routes.js";
import { pricingRouter } from "./routes/pricing.routes.js";
import { leadsRouter } from "./routes/leads.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { quotesRouter } from "./routes/quotes.routes.js";
import { catalogRouter } from "./routes/catalog.routes.js";
import { storeRouter, bookingRouter } from "./routes/store.routes.js";




const app = express();
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// --- CORS Setup Start ---
// TODO: env.CORS_ORIGIN is an array (env.js splits it on commas), so the string filter below
// drops it and the CORS_ORIGIN env var has no effect. Only the hard-coded origins are allowed.
// Fix: spread it in (...env.CORS_ORIGIN) and confirm Render's CORS_ORIGIN value first.
const rawOrigins = [
  env.CORS_ORIGIN,
  "https://fixmatemobile.vercel.app",
  "https://fixmatemobile.com",
  "https://www.fixmatemobile.com",
  "http://localhost:5173",
];

const allowlist = new Set(
  rawOrigins
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((s) => s.trim().replace(/\/$/, ""))
);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const clean = String(origin).trim().replace(/\/$/, "");
    if (allowlist.has(clean)) return cb(null, true);

    console.error("CORS blocked:", clean, "allowlist:", [...allowlist]);
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// --- CORS Setup End ---

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
// app.use("/api/catalog", catalogRouter); // only if you actually have it
app.use("/api/pricing", pricingRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/store", storeRouter);
app.use("/api/booking", bookingRouter);


app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});
