// Module augmentation: surface user.id and user.avatarHue on Session and
// the JWT so server/client code can read them without casts.

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      avatarHue: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    avatarHue?: number;
  }
}
