const frontendOrigin = (
  process.env.FRONTEND_URL || "https://perplexity-frontend-5iaa.onrender.com"
).replace(/\/$/, "")

export const allowedOrigins = [
  frontendOrigin,
  "http://localhost:5173",
].filter(Boolean)
