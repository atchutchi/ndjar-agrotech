import { z } from "zod";

export const registerSchema = z.object({
  displayName: z.string().min(2).max(120),
  phone: z.string().min(8).max(32),
  email: z.string().email().optional(),
  password: z.string().min(10).max(200),
});

export const loginSchema = z.object({
  identifier: z.string().min(3).max(200),
  password: z.string().min(10).max(200),
});

export const verifySchema = z.object({
  userId: z.string().uuid(),
  code: z.string().min(4).max(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3).max(200),
});

export const resetPasswordSchema = z.object({
  identifier: z.string().min(3).max(200),
  code: z.string().min(4).max(8),
  newPassword: z.string().min(10).max(200),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
