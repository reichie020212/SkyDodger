import { auth } from "@/lib/auth";
import { GameScreen } from "@/components/GameScreen";

export const metadata = {
  title: "Play · Sky Dodger",
};

export default async function PlayPage() {
  const session = await auth();
  return <GameScreen signedIn={!!session?.user?.id} />;
}
