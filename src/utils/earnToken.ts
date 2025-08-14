import crypto from "crypto";

// Same map, but store token info with timestamp for expiry check
const user_token_map = new Map<
  string,
  { token: string; timestamp: number; orderId: string }
>();

export function generateEarningToken(userId: string, orderId: string) {
  const timestamp = Date.now();
  const payload = `${userId}:${orderId}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", process.env.EARNING_SECRET!)
    .update(payload)
    .digest("hex");

  user_token_map.set(userId, { token: signature, timestamp, orderId });

  return `${payload}:${signature}`;
}

export function verifyEarningToken(token: string) {
  const parts = token.split(":");
  if (parts.length !== 4) return { verified: false };

  const [userId, orderId, tsStr, signature] = parts;
  const entry = user_token_map.get(userId);

  if (!entry) return { verified: false };

  // Match token exactly
  if (entry.token !== signature) return { verified: false };

  const timestamp = Number(tsStr);
  const now = Date.now();

  // Check 1-minute expiry
  if (now - timestamp > 60_000) {
    user_token_map.delete(userId);
    return { verified: false, expired: true };
  }

  // Valid — remove from map after verification
  user_token_map.delete(userId);

  return {
    verified: true,
    userId,
    orderId,
    timestamp,
  };
}

