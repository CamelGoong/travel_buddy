"use client";

// Adapted from the Supabase UI Library password-based-auth-nextjs block.
// With email confirmation off, sign-up returns a session, so the user goes
// straight to the same destination as sign-in.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safe-next-path";

export function SignUpForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data, error } = await createClient().auth.signUp({ email, password });
    if (error) {
      setError(
        error.code === "weak_password"
          ? "비밀번호를 6자 이상으로 정해 주세요."
          : error.code === "user_already_exists"
            ? "이미 가입한 이메일이에요. 로그인해 주세요."
            : "가입하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
      setIsLoading(false);
      return;
    }
    if (!data.session) {
      // Email confirmation is still on for this project.
      setNotice("메일함에서 인증 링크를 누른 뒤 로그인해 주세요.");
      setIsLoading(false);
      return;
    }
    router.push(safeNextPath(next, "/trip"));
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>여행 친구 만들기 ✈️</CardTitle>
        <CardDescription>이메일과 비밀번호만 있으면 바로 시작해요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp}>
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
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                aria-invalid={!!error || undefined}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FieldDescription>6자 이상</FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            {notice && <p className="text-sm text-primary">{notice}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "가입하는 중…" : "가입하고 시작하기"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              이미 계정이 있어요?{" "}
              <Link href={next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login"} className="font-medium text-foreground underline underline-offset-4">
                로그인
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
