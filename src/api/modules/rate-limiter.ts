import rateLimit from 'express-rate-limit';

export default rateLimit({
  max: 300,
  message: JSON.stringify({ code: 429, message: 'You are being rate limited.' }),
  windowMs: 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
});