import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToR2, generateR2Key, validateFile } from "@/lib/r2";
import {
  checkRateLimit,
  getRateLimitErrorMessage,
  getRetryAfterSeconds,
} from "@/lib/rate-limit";
import { canUploadFiles } from "@/lib/usage-limits";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has Pro subscription for file uploads
    await canUploadFiles(session.user.id);

    // Rate limit: 10 uploads per minute per user
    const rateLimitResult = await checkRateLimit({
      namespace: "upload",
      limit: 10,
      window: "1 h",
      identifier: session.user.id,
      includeIp: false,
    });

    if (!rateLimitResult.success) {
      const retryAfter = getRetryAfterSeconds(rateLimitResult.reset);
      return NextResponse.json(
        { error: getRateLimitErrorMessage(rateLimitResult.reset) },
        {
          status: 429,
          headers: { "Retry-After": retryAfter.toString() },
        },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const typeName = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!typeName || (typeName !== "file" && typeName !== "image")) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file, typeName as "file" | "image");
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate unique key
    const key = generateR2Key(session.user.id, typeName, file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const fileUrl = await uploadToR2(key, buffer, file.type);

    return NextResponse.json({
      success: true,
      data: {
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        key,
      },
    });
  } catch (error) {
    console.error("UPLOAD_ERROR", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
