# Auth Security Review

Last audit date: 2026-03-23

## Scope

This security audit focused on NextAuth v5 implementation with credentials and GitHub providers, specifically examining areas not automatically secured by NextAuth:

- Password hashing implementation and verification
- Rate limiting and brute-force protections
- Token security (generation, storage, comparison, entropy)
- Email verification flow security
- Password reset flow security
- Profile page authorization and session validation
- Safe update patterns for user data

**Files Audited:**

- `src/auth.ts` - NextAuth configuration and credentials provider
- `src/auth.config.ts` - Provider configuration
- `src/lib/tokens.ts` - Token generation logic
- `src/app/api/auth/register/route.ts` - User registration
- `src/app/api/auth/verify/route.ts` - Email verification
- `src/app/api/auth/forgot-password/route.ts` - Password reset request
- `src/app/api/auth/reset-password/route.ts` - Password reset completion
- `src/app/api/auth/resend-verification/route.ts` - Resend verification email
- `src/app/(dashboard)/profile/actions.ts` - Profile update actions
- `src/app/(dashboard)/profile/page.tsx` - Profile page

## Findings

### CRITICAL

- **Severity**: CRITICAL
- **Title**: No Rate Limiting on Authentication Endpoints
- **Files**:
  - `src/app/api/auth/register/route.ts`
  - `src/app/api/auth/forgot-password/route.ts`
  - `src/app/api/auth/reset-password/route.ts`
  - `src/app/api/auth/resend-verification/route.ts`
  - `src/auth.ts` (credentials provider authorize method)
- **Evidence**: None of the authentication endpoints implement rate limiting. All routes accept unlimited requests per IP/user, including:
  - Sign-in attempts (credentials provider in `src/auth.ts`)
  - Registration endpoint (`POST /api/auth/register`)
  - Forgot password (`POST /api/auth/forgot-password`)
  - Reset password (`POST /api/auth/reset-password`)
  - Resend verification (`POST /api/auth/resend-verification`)
- **Impact**:
  - **Brute Force Attacks**: Attackers can attempt unlimited password guesses against user accounts
  - **Email Bombing**: Unlimited password reset/verification emails can be triggered
  - **Email Enumeration**: Despite code attempting to prevent enumeration (forgot-password/route.ts returns same message), timing attacks and unlimited requests enable account discovery
  - **Resource Exhaustion**: Email service abuse and database query flooding
- **Fix**: Implement rate limiting using a solution like `@upstash/ratelimit` with Redis or an in-memory store:

  ```typescript
  // Example implementation
  import { Ratelimit } from "@upstash/ratelimit";
  import { Redis } from "@upstash/redis";

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
  });

  // Apply to each auth route
  const identifier = getClientIp(req) || "anonymous";
  const { success } = await ratelimit.limit(identifier);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  ```

  Recommended limits:
  - Sign-in: 5 attempts per 15 minutes per IP
  - Register: 3 attempts per hour per IP
  - Forgot password: 3 requests per hour per email
  - Reset password: 5 attempts per 15 minutes per token
  - Resend verification: 3 requests per hour per email

---

- **Severity**: CRITICAL
- **Title**: Tokens Stored in Plain Text in Database
- **Files**:
  - `src/lib/tokens.ts` (token generation and storage)
  - `src/app/api/auth/verify/route.ts` (email verification token lookup)
  - `src/app/api/auth/reset-password/route.ts` (password reset token lookup)
- **Evidence**:
  - Tokens generated in `src/lib/tokens.ts` (lines 4, 32) are stored directly in the database without hashing
  - Lookups query plain text: `prisma.verificationToken.findUnique({ where: { token } })`
  - Both email verification tokens (24-hour lifespan) and password reset tokens (1-hour lifespan) stored unhashed
- **Impact**:
  - **Database Breach Exposure**: If the database is compromised (SQL injection, backup theft, insider threat), all active tokens are immediately usable by attackers
  - **Account Takeover**: Exposed password reset tokens grant full account access
  - **Privacy Violation**: Email verification tokens reveal user email addresses attempting verification
  - Violates defense-in-depth principle: tokens should be treated like passwords
- **Fix**: Hash tokens before storage using a cryptographic hash function (SHA-256):

  ```typescript
  import crypto from "crypto";

  function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  export async function generateVerificationToken(email: string) {
    const token = crypto.randomBytes(32).toString("hex"); // Raw token to send
    const hashedToken = hashToken(token);
    const expires = new Date(new Date().getTime() + 3600 * 1000 * 24);

    // Delete existing token for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Store hashed version
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires,
      },
    });

    return { identifier: email, token }; // Return raw token for email
  }

  // In verification endpoint
  const hashedToken = hashToken(token);
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: hashedToken },
  });
  ```

  Apply same pattern to password reset tokens. This ensures database compromise doesn't expose usable tokens.

### HIGH

- None

### MEDIUM

- None

### LOW

- None

## Passed Checks

The following security controls are correctly implemented:

✅ **Password Hashing with bcrypt**

- Uses `bcrypt.hash(password, 10)` in registration, password reset, and change password flows
- Salt rounds of 10 is acceptable (12 would be more modern but 10 is not a vulnerability)
- Files: `src/auth.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/(dashboard)/profile/actions.ts`

✅ **Password Verification is Timing-Safe**

- Uses `bcrypt.compare()` which implements constant-time comparison internally
- Files: `src/auth.ts` (line 66), `src/app/(dashboard)/profile/actions.ts` (line 40)

✅ **Token Expiration Enforcement**

- Email verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- Expiration checked before processing in both flows
- Files: `src/lib/tokens.ts`, `src/app/api/auth/verify/route.ts` (line 23), `src/app/api/auth/reset-password/route.ts` (line 26)

✅ **Single-Use Token Enforcement**

- Email verification: Token deleted immediately after successful verification (`src/app/api/auth/verify/route.ts` lines 42-49)
- Password reset: Token deleted in atomic transaction with password update (`src/app/api/auth/reset-password/route.ts` lines 50-58)
- No token reuse possible after consumption

✅ **Email Enumeration Prevention Attempt**

- Forgot password returns same message regardless of email existence
- Resend verification returns generic success message
- Files: `src/app/api/auth/forgot-password/route.ts` (lines 14-20), `src/app/api/auth/resend-verification/route.ts` (lines 18-22)
- Note: Without rate limiting, timing attacks can still enable enumeration

✅ **Profile Authorization and Session Validation**

- All profile actions validate session: `if (!session?.user?.id)` before any operation
- Database queries scoped to authenticated user's ID
- Files: `src/app/(dashboard)/profile/actions.ts` (lines 19-24), `src/app/(dashboard)/profile/page.tsx` (lines 13-14)

✅ **Safe Profile Update Patterns**

- Change password action only updates password field explicitly
- Validates current password before allowing new password
- No mass assignment vulnerabilities
- Uses Zod schema validation for input sanitization
- File: `src/app/(dashboard)/profile/actions.ts`

✅ **Password Reset Flow Email Validation**

- Verifies identifier prefix to ensure reset token (not verification token) used
- Validates user existence before allowing password update
- File: `src/app/api/auth/reset-password/route.ts` (lines 34-40)

✅ **Atomic Password Reset Transaction**

- Password update and token deletion wrapped in `prisma.$transaction()`
- Prevents race conditions and ensures consistency
- File: `src/app/api/auth/reset-password/route.ts` (lines 50-58)

✅ **Token Generation Uses CSPRNG**

- `crypto.randomUUID()` uses cryptographically secure randomness and is acceptable for unguessable tokens
- File: `src/lib/tokens.ts`

## Summary

**Issue Count by Severity:**

- CRITICAL: 2
- HIGH: 0
- MEDIUM: 0
- LOW: 0

**Top Priority Fixes:**

1. **CRITICAL - Implement Rate Limiting** (All auth endpoints)
   - Prevents brute force, email bombing, enumeration, and resource exhaustion
   - Affects all authentication flows
   - Recommended: Use `@upstash/ratelimit` or similar with Redis/KV store

2. **CRITICAL - Hash Tokens Before Database Storage** (`src/lib/tokens.ts`)
   - Protects against database breach account takeover
   - Apply to both email verification and password reset tokens
   - Use SHA-256 hashing before storage

3. **Hardening - Review rate-limit strategy for distributed deployment**

- Ensure chosen limiter works consistently across instances/regions
- Add monitoring for 429 events and auth abuse patterns

**Overall Assessment:**

The authentication implementation demonstrates several strong security practices including proper password hashing, single-use token enforcement, session validation, and safe update patterns. However, the **absence of rate limiting** and **plain text token storage** represent critical vulnerabilities that require immediate remediation. These issues are common in early-stage applications but must be addressed before production deployment.

The codebase correctly avoids common pitfalls like mass assignment vulnerabilities and implements proper authorization checks. With the recommended fixes applied, the authentication system would meet industry security standards for a production application.
