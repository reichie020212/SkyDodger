"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "./auth";
import { prisma } from "./prisma";

const HueSchema = z.number().int().min(0).max(359);

export async function updateAvatarHue(hue: number): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };

  const parsed = HueSchema.safeParse(hue);
  if (!parsed.success) return { ok: false };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarHue: parsed.data },
  });

  revalidatePath("/profile");
  revalidatePath(`/u/${session.user.id}`);
  return { ok: true };
}
