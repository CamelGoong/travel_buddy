import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/features/auth";

export default function Page() {
  return (
    <AppShell>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <p className="font-heading text-sm font-semibold text-primary">Travel Buddy · 오사카</p>
        <LoginForm />
      </div>
    </AppShell>
  );
}
