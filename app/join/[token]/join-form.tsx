"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MAX_NICKNAME } from "@/features/members";

import { joinWithLink, type JoinFormState } from "../actions";

export function JoinForm({ token, defaultNickname }: { token: string; defaultNickname: string }) {
  const [state, formAction, pending] = useActionState<JoinFormState, FormData>(joinWithLink.bind(null, token), {
    error: null,
    nickname: defaultNickname,
  });
  const invalid = !!state.error || undefined;
  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <Field data-invalid={invalid}>
        <FieldLabel htmlFor="nickname">이 여행에서 쓸 닉네임</FieldLabel>
        <Input
          id="nickname"
          name="nickname"
          maxLength={MAX_NICKNAME}
          defaultValue={state.nickname}
          key={`n-${state.nickname}-${state.error ?? ""}`}
          aria-invalid={invalid}
        />
        <FieldDescription>여비 태그와 서류에 이 이름이 보여요. 나중에 바꿀 수 있어요.</FieldDescription>
        <FieldError>{state.error}</FieldError>
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "참여하는 중…" : "참여하기"}
      </Button>
    </form>
  );
}
