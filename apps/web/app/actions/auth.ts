"use server";

import { signIn } from "../../auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard/units",
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      // The error message might be wrapped by NextAuth
      const message = error.cause?.err?.message || error.message;
      
      if (message === "USER_NOT_FOUND") {
        return { error: "USER_NOT_FOUND" };
      }
      if (message === "INVALID_PASSWORD") {
        return { error: "INVALID_PASSWORD" };
      }
      if (message === "DATABASE_ERROR") {
        return { error: "DATABASE_ERROR" };
      }

      switch (error.type) {
        case "CredentialsSignin":
          return { error: "INVALID_CREDENTIALS" };
        default:
          return { error: "AUTH_ERROR" };
      }
    }
    
    // For non-AuthErrors that might bubble up (like redirects in Next.js which are actually errors)
    if (error.message?.includes("NEXT_REDIRECT")) {
        throw error;
    }

    console.error("Login action error:", error);
    return { error: "UNKNOWN_ERROR" };
  }
}
