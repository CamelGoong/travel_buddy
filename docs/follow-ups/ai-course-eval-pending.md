# AI 코스 eval(AC10·AC11) 본 실행 보류

- 증상: AC10(장소 실재성 9/10)과 AC11(조건 반영 8/10)의 점수를 아직 재지 않았다. 사용량 여유가 적어 본 실행을 미뤘다.
- 근거: 케이스 10개는 `docs/specs/ai-course-draft/eval-cases.json`, 러너는 `.claude/hillclimb/ai-course-draft-ac10-ac11/run.ts`에 있다. 시험 실행 5건에서 "교토 가이유칸"(가이유칸은 오사카)처럼 실재성 오류가 나왔다.
- 원인 추정: 장소를 LLM이 자유롭게 고르는 구조라 이름과 위치가 어긋날 수 있다(스펙의 남은 위험).
- 시도한 것: 시험 실행에서 14일 여행이 10초 제한에 걸려 `features/ai-course/generate.ts`의 타임아웃을 6일까지 10초, 이후 하루마다 2초 추가로 바꿨다. `docs/decisions/llm-integration.md`의 "기본 10초"와 어긋나므로 결정 문서 갱신 여부를 정해야 한다.
- 다음 단계: `bun .claude/hillclimb/ai-course-draft-ac10-ac11/run.ts baseline 2`로 20번 호출한 뒤 Claude 서브에이전트로 채점한다. 미달이면 프롬프트를 고쳐 다시 측정한다.
