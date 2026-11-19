import { createClient } from "@/lib/supabase/server";

import { OnboardingTour } from "./tour";

/** True for a signed-in account that has not seen the introduction yet. */
async function needsTour(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return !!data.user && data.user.user_metadata?.onboarded !== true;
  } catch {
    return false;
  }
}

/** Renders the introduction for a signed-in account that has not seen it yet. */
export async function OnboardingGate() {
  return (await needsTour()) ? <OnboardingTour /> : null;
}
