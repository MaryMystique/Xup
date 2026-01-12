import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// This is your secret key - keep it secret!
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * Hash a password before storing in database
 * @param password - Plain text password from user
 * @returns Encrypted password string
 * 
 * EXPLANATION:
 * - Never store passwords as plain text (security risk!)
 * - bcrypt converts "password123" into gibberish like "$2a$10$xYz..."
 * - Even if database is hacked, attackers can't read passwords
 * - Salt rounds (10) = how many times to scramble it (more = slower but safer)
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Check if entered password matches stored hash
 * @param password - What user typed in login form
 * @param hashedPassword - Encrypted password from database
 * @returns true if match, false if wrong password
 * 
 * EXPLANATION:
 * - User types "password123"
 * - We compare it to the gibberish stored in database
 * - bcrypt can tell if they match without decrypting
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Create a JWT token (digital ID card)
 * @param userId - User's unique ID from database
 * @param email - User's email
 * @param role - "agent" or "admin"
 * @returns Token string that proves user is logged in
 * 
 * EXPLANATION:
 * - JWT = JSON Web Token (like a concert wristband)
 * - Contains user info (id, email, role)
 * - Signed with secret key (so nobody can fake it)
 * - Expires in 7 days (then user must login again)
 * - We send this token with every request to prove identity
 */
export function createToken(userId: string, email: string, role: string): string {
  const payload = {
    userId,
    email,
    role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token valid for 7 days
  });
}

/**
 * Verify a JWT token is valid
 * @param token - Token from user's browser
 * @returns Decoded user info if valid, null if fake/expired
 * 
 * EXPLANATION:
 * - User sends token with request
 * - We check: Is it signed with our secret? Is it expired?
 * - If valid, extract user info from it
 * - If invalid/expired, user must login again
 */
export function verifyToken(token: string): {
  userId: string;
  email: string;
  role: string;
} | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Extract token from request cookies
 * @param cookieHeader - Cookie string from request
 * @returns Token string or null if not found
 * 
 * EXPLANATION:
 * - Browser stores token in cookies
 * - Cookies come as string: "token=abc123; other=xyz"
 * - We extract just the token part
 */
export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));

  if (!tokenCookie) return null;

  return tokenCookie.split('=')[1];
}