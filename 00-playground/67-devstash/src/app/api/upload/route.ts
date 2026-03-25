import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  uploadToR2,
  generateR2Key,
  validateFile,
  FILE_CONSTRAINTS,
} from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
