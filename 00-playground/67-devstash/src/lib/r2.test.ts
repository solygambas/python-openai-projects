import { describe, expect, it, vi } from "vitest";

// Mock environment variables
vi.stubEnv("R2_ACCOUNT_ID", "test-account-id");
vi.stubEnv("R2_ACCESS_KEY_ID", "test-access-key");
vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret-key");
vi.stubEnv("R2_BUCKET_NAME", "test-bucket");

const { validateFile } = await import("@/lib/r2");

describe("validateFile", () => {
	describe("image type", () => {
		it("accepts valid PNG image under size limit", () => {
			const file = new File(["x".repeat(1000)], "test.png", {
				type: "image/png",
			});
			const result = validateFile(file, "image");
			expect(result.valid).toBe(true);
		});

		it("accepts valid JPEG image under size limit", () => {
			const file = new File(["x".repeat(1000)], "test.jpg", {
				type: "image/jpeg",
			});
			const result = validateFile(file, "image");
			expect(result.valid).toBe(true);
		});

		it("accepts valid SVG image", () => {
			const file = new File(["<svg></svg>"], "test.svg", {
				type: "image/svg+xml",
			});
			const result = validateFile(file, "image");
			expect(result.valid).toBe(true);
		});

		it("rejects image exceeding 5 MB size limit", () => {
			const fiveMB = 5 * 1024 * 1024;
			const file = new File(["x".repeat(fiveMB + 1)], "test.png", {
				type: "image/png",
			});
			const result = validateFile(file, "image");
			expect(result.valid).toBe(false);
			expect(result.error).toContain("5MB limit");
		});

		it("accepts image exactly at 5 MB limit", () => {
			const fiveMB = 5 * 1024 * 1024;
			const file = new File(["x".repeat(fiveMB)], "test.png", {
				type: "image/png",
			});
			const result = validateFile(file, "image");
			expect(result.valid).toBe(true);
		});

		it("rejects image with invalid extension", () => {
			const file = new File(["content"], "test.exe", {
				type: "image/png",
			});
			const result = validateFile(file, "image");
			expect(result.valid).toBe(false);
			expect(result.error).toContain("Invalid file type");
		});

		it("rejects image with invalid MIME type", () => {
			const file = new File(["content"], "test.png", {
				type: "application/pdf",
			});
			const result = validateFile(file, "image");
			expect(result.valid).toBe(false);
			expect(result.error).toContain("Invalid MIME type");
		});
	});

	describe("file type", () => {
		it("accepts valid PDF file under size limit", () => {
			const file = new File(["x".repeat(1000)], "document.pdf", {
				type: "application/pdf",
			});
			const result = validateFile(file, "file");
			expect(result.valid).toBe(true);
		});

		it("accepts valid JSON file", () => {
			const file = new File(['{"test": true}'], "data.json", {
				type: "application/json",
			});
			const result = validateFile(file, "file");
			expect(result.valid).toBe(true);
		});

		it("accepts valid markdown file", () => {
			const file = new File(["# Heading"], "readme.md", {
				type: "text/markdown",
			});
			const result = validateFile(file, "file");
			expect(result.valid).toBe(true);
		});

		it("rejects file exceeding 10 MB size limit", () => {
			const tenMB = 10 * 1024 * 1024;
			const file = new File(["x".repeat(tenMB + 1)], "document.pdf", {
				type: "application/pdf",
			});
			const result = validateFile(file, "file");
			expect(result.valid).toBe(false);
			expect(result.error).toContain("10MB limit");
		});

		it("accepts file exactly at 10 MB limit", () => {
			const tenMB = 10 * 1024 * 1024;
			const file = new File(["x".repeat(tenMB)], "document.pdf", {
				type: "application/pdf",
			});
			const result = validateFile(file, "file");
			expect(result.valid).toBe(true);
		});

		it("rejects file with invalid extension", () => {
			const file = new File(["content"], "test.exe", {
				type: "application/pdf",
			});
			const result = validateFile(file, "file");
			expect(result.valid).toBe(false);
			expect(result.error).toContain("Invalid file type");
		});

		it("rejects file with invalid MIME type", () => {
			const file = new File(["content"], "test.pdf", {
				type: "image/png",
			});
			const result = validateFile(file, "file");
			expect(result.valid).toBe(false);
			expect(result.error).toContain("Invalid MIME type");
		});
	});

	describe("edge cases", () => {
		it("rejects empty filename", () => {
			const file = new File(["content"], "", {
				type: "application/pdf",
			});
			const result = validateFile(file, "file");
			expect(result.valid).toBe(false);
			expect(result.error).toContain("Invalid file type");
		});

		it("handles filename with special characters", () => {
			const file = new File(["content"], "my file (1).pdf", {
				type: "application/pdf",
			});
			const result = validateFile(file, "file");
			expect(result.valid).toBe(true);
		});

		it("rejects one byte over image limit", () => {
			const fiveMB = 5 * 1024 * 1024;
			const file = new File(["x".repeat(fiveMB + 1)], "test.png", {
				type: "image/png",
			});
			const result = validateFile(file, "image");
			expect(result.valid).toBe(false);
		});

		it("rejects one byte over file limit", () => {
			const tenMB = 10 * 1024 * 1024;
			const file = new File(["x".repeat(tenMB + 1)], "document.pdf", {
				type: "application/pdf",
			});
			const result = validateFile(file, "file");
			expect(result.valid).toBe(false);
		});
	});
});
