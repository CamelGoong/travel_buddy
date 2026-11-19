"use client";

// Adapted from the Supabase UI Library password-based-auth-nextjs block.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError("이메일이나 비밀번호가 맞지 않아요.");
      setIsLoading(false);
      return;
    }
    router.push(safeNextPath(next ?? new URLSearchParams(window.location.search).get("next"), "/trip"));
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>다시 왔네요 👋</CardTitle>
        <CardDescription>이메일로 로그인하고 여행을 이어 가요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">이메일</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field data-invalid={!!error || undefined}>
              <FieldLabel htmlFor="password">비밀번호</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                aria-invalid={!!error || undefined}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "로그인하는 중…" : "로그인"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              처음이에요?{" "}
              <Link href={next ? `/auth/sign-up?next=${encodeURIComponent(next)}` : "/auth/sign-up"} className="font-medium text-foreground underline underline-offset-4">
                가입하기
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
