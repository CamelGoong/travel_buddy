# 쓰지 않게 될 briefing_dismissals 테이블 정리

**Symptom**: `osaka-contextual-suggestions`부터 아침·저녁 안내 확인 기록을 `suggestion_records`에 저장한다. 그런데 `briefing_dismissals` 테이블이 DB에 그대로 남아 있다.

**Observed evidence**: 2026-11-19 마이그레이션 `20261119051723`이 테이블 이름을 바꾸자, 이미 배포된 첫 버전 앱이 읽는 `briefing_dismissals`가 사라졌다. 그래서 `20261119051815`로 원래 테이블을 되살리고, 새 테이블을 따로 만들어 기존 행 7개를 복사했다.

**Suspected cause**: 배포된 빌드와 새 스키마가 겹치는 기간에 대한 고려가 없었다.

**What was tried**: 두 테이블을 함께 두었다. 새 코드는 `suggestion_records`만 읽고 쓴다.

**Proposed next step**: 이 브랜치가 main에 병합되어 Vercel 배포가 새 코드로 바뀐 뒤, `briefing_dismissals`를 지우는 마이그레이션을 추가한다. 그 전에 병합 사이에 첫 버전이 쓴 행만 `suggestion_records`로 한 번 더 복사한다(중복은 unique 제약으로 무시).
