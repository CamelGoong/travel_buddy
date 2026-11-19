import Link from "next/link";
import { RiHome5Line, RiUser3Line } from "@remixicon/react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/features/auth";

const BORDERED = "border-primary/35 bg-white/70";

/**
 * The three always-visible buttons: my trips, my page, log out. Each has a visible
 * edge; the button of the page you are on is left out.
 */
export function AppNav({ current }: { current?: "trips" | "mypage" }) {
  return (
    <nav aria-label="내 메뉴" className="flex flex-wrap justify-end gap-1.5">
      {current !== "trips" && (
        <Link href="/trips" className={cn(buttonVariants({ variant: "outline", size: "sm" }), BORDERED)}>
          <RiHome5Line data-icon="inline-start" />
          내 여행
        </Link>
      )}
      {current !== "mypage" && (
        <Link href="/mypage" className={cn(buttonVariants({ variant: "outline", size: "sm" }), BORDERED)}>
          <RiUser3Line data-icon="inline-start" />
          마이페이지
        </Link>
      )}
      <LogoutButton className={BORDERED} />
    </nav>
  );
}
