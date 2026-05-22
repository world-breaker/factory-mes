import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    username?: string;
    workTypeId?: number | null;
    assignedLine?: number | null;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      username: string;
      workTypeId?: number | null;
      assignedLine?: number | null;
    } & DefaultSession["user"];
  }
}

// JWT types are handled by NextAuth v5 internally
// No need for separate augmentation
