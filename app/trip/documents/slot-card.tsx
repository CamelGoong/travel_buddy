"use client";

import { useRef, useState, useTransition } from "react";
import { RiAttachment2, RiFileTextLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { fileProblem, OFFLINE_BY_DEFAULT, type SlotKind } from "@/features/documents";

import { OfflineBadge } from "@/components/offline-badge";
import {
  changeFileOffline,
  changeFilePlace,
  changeFileShared,
  registerFile,
  removeFile,
  removeSlot,
} from "./actions";

type FileView = { id: number; fileName: string; placeName: string | null; shared: boolean; offline: boolean };
type SharedView = { id: number; fileName: string; ownerNickname: string };

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** One document slot: its files, an upload button, and (for tickets) the place link. */
export function SlotCard({
  slotId,
  tripId,
  userId,
  kind,
  name,
  files,
  sharedFiles = [],
  canShare,
  places,
}: {
  slotId: number;
  tripId: number;
  userId: string;
  kind: SlotKind;
  name: string;
  files: FileView[];
  /** Files companions chose to show in this kind of slot */
  sharedFiles?: SharedView[];
  /** Whether other members exist to share with */
  canShare: boolean;
  /** Course-draft places as "N일차 장소" options for tickets */
  places: { name: string; label: string }[];
}) {
  const input = useRef<HTMLInputElement>(null);
  const [place, setPlace] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [askDelete, setAskDelete] = useState<number | "slot" | null>(null);
  const [, startTransition] = useTransition();

  const upload = async (file: File) => {
    setError(null);
    const problem = fileProblem(file, files.length);
    if (problem) return setError(problem);

    setUploading(true);
    const path = `${userId}/${tripId}/${crypto.randomUUID()}`;
    const { error: uploadError } = await createClient()
      .storage.from("trip-documents")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setUploading(false);
      return setError("올리지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
    const message = await registerFile({
      slotId,
      path,
      name: file.name,
      type: file.type,
      size: file.size,
      placeName: kind === "ticket" && place ? place : null,
    });
    setUploading(false);
    if (message) setError(message);
  };

  return (
    <Card size="sm" data-testid={`slot-${kind}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {name}
          <span className="text-sm font-normal text-muted-foreground">
            {files.length === 0 ? "비어 있음" : `${files.length}개`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {files.length > 0 && (
          <ul className="flex flex-col gap-2">
            {files.map((f) => (
              <li key={f.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`/trip/documents/file/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center gap-2 underline-offset-4 hover:underline"
                  >
                    <RiFileTextLine className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{f.fileName}</span>
                  </a>
                  <OfflineBadge fileId={f.id} />
                  {askDelete === f.id ? (
                    <span className="flex shrink-0 gap-1">
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => {
                          setAskDelete(null);
                          startTransition(() => removeFile(f.id));
                        }}
                      >
                        지우기
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => setAskDelete(null)}>
                        취소
                      </Button>
                    </span>
                  ) : (
                    <Button size="xs" variant="ghost" onClick={() => setAskDelete(f.id)}>
                      삭제
                    </Button>
                  )}
                </div>
                {kind === "ticket" && (
                  <select
                    aria-label="입장권 장소"
                    className={SELECT_CLASS}
                    value={f.placeName ?? ""}
                    onChange={(e) => {
                      const next = e.target.value || null;
                      startTransition(() => changeFilePlace(f.id, next));
                    }}
                  >
                    <option value="">장소 없음</option>
                    {places.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                )}
                {!OFFLINE_BY_DEFAULT.includes(kind) && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={f.offline}
                      onChange={(e) => {
                        const next = e.target.checked;
                        startTransition(() => changeFileOffline(f.id, next));
                      }}
                    />
                    오프라인에서도 열기
                  </label>
                )}
                {kind !== "passport" && canShare && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={f.shared}
                      onChange={(e) => {
                        const next = e.target.checked;
                        startTransition(() => changeFileShared(f.id, next));
                      }}
                    />
                    동반자와 함께 보기
                  </label>
                )}
              </li>
            ))}
          </ul>
        )}
        {sharedFiles.length > 0 && (
          <ul className="flex flex-col gap-1.5 border-t pt-3" data-testid="shared-files">
            {sharedFiles.map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-sm">
                <RiFileTextLine className="shrink-0 text-muted-foreground" />
                <a
                  href={`/trip/documents/file/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate underline-offset-4 hover:underline"
                >
                  {f.fileName}
                </a>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">올린 사람: {f.ownerNickname}</span>
              </li>
            ))}
          </ul>
        )}

        {kind === "ticket" && (
          <select
            aria-label="새 입장권 장소"
            className={SELECT_CLASS}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          >
            <option value="">장소 없음</option>
            {places.map((p) => (
              <option key={p.name} value={p.name}>
                {p.label}
              </option>
            ))}
          </select>
        )}

        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="sr-only"
          data-testid={`upload-${kind}`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => input.current?.click()}>
            <RiAttachment2 data-icon="inline-start" />
            {uploading ? "올리는 중…" : "파일 올리기"}
          </Button>
          {kind === "custom" &&
            (askDelete === "slot" ? (
              <span className="flex gap-1">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setAskDelete(null);
                    startTransition(() => removeSlot(slotId));
                  }}
                >
                  칸 지우기
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAskDelete(null)}>
                  취소
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setAskDelete("slot")}>
                칸 삭제
              </Button>
            ))}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
