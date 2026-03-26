import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getFileFromR2, extractKeyFromUrl } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the item to verify ownership and get file info
    const item = await prisma.item.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        fileUrl: true,
        fileName: true,
      },
    });

    if (!item || !item.fileUrl) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Extract key from URL
    const key = extractKeyFromUrl(item.fileUrl);
    if (!key) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    // Get file from R2
    const fileData = await getFileFromR2(key);
    if (!fileData) {
      return NextResponse.json(
        { error: "File not found in storage" },
        { status: 404 },
      );
    }

    // Return the file with proper headers
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(fileData.body);
    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": fileData.contentType,
        "Content-Disposition": `attachment; filename="${item.fileName || "download"}"`,
        "Content-Length": uint8Array.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("DOWNLOAD_ERROR", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
