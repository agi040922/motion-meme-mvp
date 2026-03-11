import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = {
  title: "Motion Meme - Camera Guide",
  description: "Check camera permission before entering the stage.",
};

export default async function PlayPermissionsPage() {
  await requireUser("/play/permissions");
  redirect("/play");
}
