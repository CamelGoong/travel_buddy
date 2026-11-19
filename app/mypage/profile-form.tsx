"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  AVATAR_BUCKET,
  avatarPath,
  avatarProblem,
  MAX_DISPLAY_NAME,
  parseDisplayName,
} from "@/features/profile";

/** Name and photo of the signed-in account. Both save straight to the account. */
export function ProfileForm({
  userId,
  displayName,
  avatarUrl,
  currentAvatarPath,
}: {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  currentAvatarPath: string | null;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(displayName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const parsed = parseDisplayName(name);
    if (!parsed.ok) return setNameError(parsed.error);
    setNameError(null);
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ data: { display_name: parsed.name } });
    setBusy(false);
    if (error) return setNameError("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    setName(parsed.name);
    setNotice("이름을 저장했어요");
    router.refresh();
  };

  const uploadPhoto = async (file: File) => {
    setNotice(null);
    const problem = avatarProblem(file);
    if (problem) return setPhotoError(problem);
    setPhotoError(null);
    setBusy(true);
    const supabase = createClient();
    const path = avatarPath(userId, file.type, Date.now());
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { contentType: file.type });
    if (uploadError) {
      setBusy(false);
      return setPhotoError("사진을 올리지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
    const { error } = await supabase.auth.updateUser({ data: { avatar_path: path } });
    if (error) {
      await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      setBusy(false);
      return setPhotoError("사진을 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
    if (currentAvatarPath) await supabase.storage.from(AVATAR_BUCKET).remove([currentAvatarPath]);
    setBusy(false);
    setNotice("사진을 바꿨어요");
    router.refresh();
  };

  const removePhoto = async () => {
    if (!currentAvatarPath) return;
    setNotice(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { avatar_path: "" } });
    if (error) {
      setBusy(false);
      return setPhotoError("사진을 지우지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
    await supabase.storage.from(AVATAR_BUCKET).remove([currentAvatarPath]);
    setBusy(false);
    setNotice("사진을 지웠어요");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // A short-lived signed link to the private photo; next/image cannot optimise it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="내 사진" className="size-20 rounded-full border border-white/80 object-cover shadow-md" />
        ) : (
          <span
            aria-label="사진 없음"
            className="grid size-20 place-items-center rounded-full bg-[linear-gradient(135deg,var(--primary-from),var(--primary-to))] text-2xl font-extrabold text-primary-foreground shadow-md"
          >
            {[...displayName][0]?.toUpperCase() ?? "나"}
          </span>
        )}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInput}
            id="avatar-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            data-testid="avatar-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void uploadPhoto(file);
            }}
          />
          <span className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>
              {avatarUrl ? "사진 바꾸기" : "사진 올리기"}
            </Button>
            {avatarUrl && (
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={removePhoto}>
                지우기
              </Button>
            )}
          </span>
          {photoError && (
            <p className="text-sm text-destructive" role="alert">
              {photoError}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={saveName} noValidate className="flex flex-col gap-3">
        <Field data-invalid={!!nameError || undefined}>
          <FieldLabel htmlFor="display-name">이름</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="display-name"
              name="name"
              maxLength={MAX_DISPLAY_NAME}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!nameError || undefined}
            />
            <Button type="submit" disabled={busy}>
              저장
            </Button>
          </div>
          <FieldDescription>여행마다 쓰는 닉네임과는 따로예요. 여행 화면에서 바꿀 수 있어요.</FieldDescription>
          <FieldError>{nameError}</FieldError>
        </Field>
      </form>

      {notice && (
        <p className="text-sm text-muted-foreground" role="status" data-testid="profile-notice">
          {notice}
        </p>
      )}
    </div>
  );
}
