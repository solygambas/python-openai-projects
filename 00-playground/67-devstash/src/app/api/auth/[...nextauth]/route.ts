import { handlers } from "@/auth";
import { NextRequest } from "next/server";
import {
  checkRateLimit,
  getRateLimitErrorMessage,
  getRetryAfterSeconds,
} from "@/lib/rate-limit";

export const { GET } = handlers;

async function getLoginEmailFromRequest(
  request: Request
): Promise<string | undefined> {
  try {
    const contentType =
      request.headers.get("content-type")?.toLowerCase() ?? "";

    if (contentType.includes("application/json")) {
      const payload = (await request.clone().json()) as { email?: unknown };
      return typeof payload.email === "string" ? payload.email : undefined;
    }

    const formData = await request.clone().formData();
    const emailValue = formData.get("email");
    return typeof emailValue === "string" ? emailValue : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const pathname = new URL(request.url).pathname;

  if (pathname.endsWith("/callback/credentials")) {
    const email = await getLoginEmailFromRequest(request);
    const rateLimitResult = await checkRateLimit({
      namespace: "auth-login",
      limit: 5,
      window: "15 m",
      request,
      identifier: email,
    });

    if (!rateLimitResult.success) {
      const retryAfter = getRetryAfterSeconds(rateLimitResult.reset);

      return Response.json(
        { error: getRateLimitErrorMessage(rateLimitResult.reset) },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      );
    }
  }

  return handlers.POST(request);
}
