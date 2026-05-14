import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "ar_admin";
const ONE_DAY_SECONDS = 60 * 60 * 24;

function getSecret() {
  return process.env.ADMIN_SECRET || "ar-fitness-admin-secret";
}

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function createAdminToken() {
  const exp = Date.now() + ONE_DAY_SECONDS * 1000;
  const payload = `admin.${exp}`;

  return `${payload}.${sign(payload)}`;
}

export async function setAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_DAY_SECONDS,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const lastDot = token.lastIndexOf(".");

  if (lastDot === -1) {
    return false;
  }

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const parts = payload.split(".");

  if (parts.length !== 2 || parts[0] !== "admin") {
    return false;
  }

  const exp = Number(parts[1]);
  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  if (exp < Date.now()) {
    return false;
  }

  return true;
}

export async function requireAdmin() {
  const authed = await getAdminAuth();

  if (!authed) {
    redirect("/admin/login");
  }
}
