import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    username?: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      username: string;
    } & DefaultSession["user"];
  }
}

// JWT types are handled by NextAuth v5 internally
// No need for separate augmentation
