import { createHmac, timingSafeEqual } from "node:crypto";

type JwtPayload = {
  sub: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
};

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET manquant.");
  }
  return secret;
};

const toBase64Url = (input: string) => Buffer.from(input, "utf8").toString("base64url");
const fromBase64Url = (input: string) => Buffer.from(input, "base64url").toString("utf8");

const sign = (header: string, payload: string, secret: string) => {
  return createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
};

export const createToken = (payload: Omit<JwtPayload, "iat" | "exp">, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };

  const headerEncoded = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadEncoded = toBase64Url(JSON.stringify(fullPayload));
  const signature = sign(headerEncoded, payloadEncoded, secret);
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
};

export const verifyToken = (token: string): JwtPayload | null => {
  const secret = getJwtSecret();
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [headerEncoded, payloadEncoded, signature] = parts;
  if (!headerEncoded || !payloadEncoded || !signature) {
    return null;
  }

  const expectedSignature = sign(headerEncoded, payloadEncoded, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const header = JSON.parse(fromBase64Url(headerEncoded)) as { alg?: string; typ?: string };
    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null;
    }

    const payload = JSON.parse(fromBase64Url(payloadEncoded)) as Partial<JwtPayload>;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return null;
    }

    return payload as JwtPayload;
  } catch {
    return null;
  }
};
