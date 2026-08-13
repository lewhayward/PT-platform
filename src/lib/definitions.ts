import * as z from "zod";

// Shared validation rules for the sign-up and login forms. Keeping them
// here (instead of inline in the server actions) means the same rules are
// easy to find and reuse if we add more forms later.

export const SignupSchema = z.object({
  fullName: z
    .string()
    .min(2, { error: "Please enter your full name." })
    .trim(),
  email: z.email({ error: "Please enter a valid email address." }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." }),
  role: z.enum(["trainer", "client"], {
    error: "Please choose an account type.",
  }),
});

export const LoginSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }).trim(),
  password: z.string().min(1, { error: "Please enter your password." }),
});

export type SignupFormState =
  | {
      errors?: {
        fullName?: string[];
        email?: string[];
        password?: string[];
        role?: string[];
      };
      message?: string;
    }
  | undefined;

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const InviteClientSchema = z.object({
  fullName: z
    .string()
    .min(2, { error: "Please enter the client's full name." })
    .trim(),
  email: z.email({ error: "Please enter a valid email address." }).trim(),
  goals: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type InviteClientFormState =
  | {
      errors?: {
        fullName?: string[];
        email?: string[];
        goals?: string[];
        notes?: string[];
      };
      message?: string;
    }
  | undefined;

export const SetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type SetPasswordFormState =
  | {
      errors?: {
        password?: string[];
        confirmPassword?: string[];
      };
      message?: string;
    }
  | undefined;
