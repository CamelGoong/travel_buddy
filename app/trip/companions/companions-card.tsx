"use client";

import { useActionState, useState, useTransition } from "react";
import { RiLinkM, RiUserAddLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MAX_MEMBERS, MAX_NICKNAME } from "@/features/members";

import {
  changeNickname,
  createInviteLink,
  leaveCurrentTrip,
  removeCompanion,
  type NicknameFormState,
} from "./actions";

type MemberView = { id: number; nickname: string; role: "owner" | "companion"; isMe: boolean };

/** Writes the invite link to the clipboard; the link is still being made when the click happens. */
async function copyLink(make: Promise<string | null>): Promise<string | null> {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      let link: string | null = null;
      const blob = make.then((value) => {
        link = value;
        return new Blob([value ?? ""], { type: "text/plain" });
      });
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      return link;
    }
  } catch {
    // Fall through to the plain write below.
  }
  const link = await make;
  if (link) await navigator.clipboard.writeText(link).catch(() => {});
  return link;
}

export function CompanionsCard({
  tripId,
  isOwner,
  members,
}: {
  tripId: number;
  isOwner: boolean;
  members: MemberView[];
}) {
  const me = members.find((m) => m.isMe);
  const [notice, setNotice] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [askRemove, setAskRemove] = useState<number | "leave" | null>(null);
  const [, startTransition] = useTransition();
  const [nameState, nameAction, namePending] = useActionState<NicknameFormState, FormData>(
    changeNickname.bind(null, tripId),
    { error: null, nickname: me?.nickname ?? "", saved: 0 },
  );

  return (
    <Card data-testid="companions-card">
      <CardHeader>
        <CardTitle>
          함께하는 사람 {members.length}/{MAX_MEMBERS}
        </CardTitle>
        <CardDescription>
          {isOwner ? "링크를 보내면 같은 일정을 함께 볼 수 있어요." : "같은 일정을 함께 보고 있어요."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2" data-testid="members">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                {m.nickname}
                {m.role === "owner" && <Badge variant="secondary">주인</Badge>}
                {m.isMe && <Badge variant="outline">나</Badge>}
              </span>
              {isOwner &&
                m.role === "companion" &&
                (askRemove === m.id ? (
                  <span className="flex gap-1">
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => {
                        setAskRemove(null);
                        startTransition(() => removeCompanion(m.id));
                      }}
                    >
                      내보내기
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setAskRemove(null)}>
                      취소
                    </Button>
                  </span>
                ) : (
                  <Button size="xs" variant="ghost" onClick={() => setAskRemove(m.id)}>
                    내보내기
                  </Button>
                ))}
            </li>
          ))}
        </ul>

        <form action={nameAction} noValidate className="flex flex-col gap-2">
          <Field data-invalid={!!nameState.error || undefined}>
            <FieldLabel htmlFor="my-nickname">내 닉네임</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="my-nickname"
                name="nickname"
                maxLength={MAX_NICKNAME}
                defaultValue={nameState.nickname || me?.nickname}
                key={`nick-${nameState.saved}-${nameState.error ?? ""}`}
                aria-invalid={!!nameState.error || undefined}
              />
              <Button type="submit" variant="outline" disabled={namePending}>
                바꾸기
              </Button>
            </div>
            <FieldError>{nameState.error}</FieldError>
          </Field>
        </form>

        {isOwner ? (
          <div className="flex flex-col gap-2">
            <Button
              disabled={members.length >= MAX_MEMBERS}
              onClick={async () => {
                setNotice(null);
                const made = await copyLink(createInviteLink());
                if (made) {
                  setLink(made);
                  setNotice("링크를 복사했어요");
                } else {
                  setNotice("링크를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.");
                }
              }}
            >
              <RiUserAddLine data-icon="inline-start" />
              동반자 초대
            </Button>
            {notice && (
              <p className="text-sm text-muted-foreground" role="status" data-testid="invite-notice">
                {notice}
              </p>
            )}
            {link && (
              <p className="flex items-center gap-1 break-all text-xs text-muted-foreground" data-testid="invite-link">
                <RiLinkM className="shrink-0" />
                {link}
              </p>
            )}
            <p className="text-xs text-muted-foreground">링크는 7일 동안 쓸 수 있고, 다시 만들면 이전 링크는 멈춰요.</p>
          </div>
        ) : askRemove === "leave" ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              나가면 내가 올린 서류와 체크리스트 표시가 지워져요. 여비는 남아요.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => startTransition(() => leaveCurrentTrip(tripId))}>
                나가기
              </Button>
              <Button variant="ghost" onClick={() => setAskRemove(null)}>
                취소
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setAskRemove("leave")}>
            여행에서 나가기
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
