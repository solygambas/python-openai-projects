import { z } from "zod";

/**
 * Validate input against a Zod schema
 * @returns The validated data or an error message
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
): T | { error: string } {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid input" };
  }
  return result.data;
}

/**
 * Standard action result type
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
