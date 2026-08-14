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
  goal: z.enum(["bodybuilding", "fat_loss", "general_fitness", "strength"], {
    error: "Please choose a primary goal.",
  }),
  daysPerWeek: z.coerce
    .number({ error: "Please choose how many days a week they can train." })
    .int()
    .min(1)
    .max(7),
  goals: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type InviteClientFormState =
  | {
      errors?: {
        fullName?: string[];
        email?: string[];
        goal?: string[];
        daysPerWeek?: string[];
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

export const ProgrammeExerciseSchema = z.object({
  exerciseName: z
    .string()
    .min(1, { error: "Please choose or type an exercise." })
    .trim(),
  sets: z.coerce
    .number({ error: "Enter the number of sets." })
    .int()
    .min(1)
    .max(20),
  reps: z
    .string()
    .min(1, { error: "Enter reps, e.g. 8-10 or AMRAP." })
    .trim(),
  weight: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ProgrammeExerciseFormState =
  | {
      errors?: {
        exerciseName?: string[];
        sets?: string[];
        reps?: string[];
        weight?: string[];
        notes?: string[];
      };
      message?: string;
    }
  | undefined;

export const SimpleNameSchema = z.object({
  name: z.string().min(2, { error: "Please enter a name." }).trim(),
});

export type SimpleNameFormState =
  | {
      errors?: { name?: string[] };
      message?: string;
    }
  | undefined;
