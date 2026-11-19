# osaka-first-trip-loop 리뷰·점검에서 남긴 항목

`code-review low`(2026-11-19)와 `supabase db advisors`에서 나왔지만, 수용 기준과 주 경로를 깨지 않아 고치지 않은 항목이다.

- `app/trip/new/actions.ts`: 여행 insert와 체크리스트 insert가 한 트랜잭션이 아니다. 체크리스트 insert만 실패하면 체크리스트 없는 여행이 남고, 다시 제출하면 여행이 하나 더 생긴다. DB 함수(RPC)나 trips insert 트리거로 묶는 방안을 검토한다.
- `app/trip/check-row.tsx`: 저장 실패를 무시하고 체크 상태를 유지한다. 실패하면 되돌리고 짧은 오류를 보여 주는 방안을 검토한다.
- Supabase advisors 경고 2건: 대시보드의 "Enable RLS on new tables automatically" 옵션이 만든 `public.rls_auto_enable()`(SECURITY DEFINER)를 `anon`·`authenticated`가 RPC로 실행할 수 있다. 이 저장소 마이그레이션의 산물이 아니므로 대시보드 옵션의 의도를 확인한 뒤 `EXECUTE` 회수 여부를 정한다.
