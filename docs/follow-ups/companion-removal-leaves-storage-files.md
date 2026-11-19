# 주인이 내보낸 동반자의 서류 파일이 Storage에 남음

**Symptom**: 주인이 동반자를 내보내면 그 사람의 서류 파일 행(`document_files`)은 지워지지만, 비공개 버킷 `trip-documents`의 실제 파일은 Storage에 남는다. 동반자가 스스로 나갈 때는 앱이 그 사람의 권한으로 파일을 지운다.

**Observed evidence**: `remove_member` 함수는 DB 행만 지운다. Storage 객체는 폴더 이름이 올린 사람의 계정이라 주인의 권한으로는 지울 수 없고, Supabase는 SQL로 Storage 객체를 직접 지우는 것을 막는다. 2026-11-19 구현 중 확인한 구조이고 실제 운영 데이터로 재현한 것은 아니다.

**Suspected cause**: 앱이 공개 키(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)만 쓰고 서비스 키가 없어서, 다른 계정 폴더의 파일을 지울 수 없다.

**What was tried**: 행을 먼저 지워 주소를 모르는 사람은 열 수 없게 했다. 파일 경로는 추측하기 어려운 무작위 값이다.

**Proposed next step**: 서버 전용 서비스 키를 환경 변수로 두고 내보내기 처리에서 Storage 객체도 지우거나, 주기적으로 행이 없는 객체를 정리하는 작업을 만든다. 서비스 키는 새 비밀값이라 사용자가 정해야 한다.
