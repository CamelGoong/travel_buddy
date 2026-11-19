// The app introduction shown to new members, one card per step (docs/specs/onboarding-tour/).
//
// KEEP THIS LIST CURRENT: when a feature is added, changed, or removed, update the
// matching step here in the same change (see AGENTS.md).

export type TourIcon = "plane" | "course" | "prep" | "money" | "nudge" | "together" | "start";

export type TourStep = {
  id: string;
  icon: TourIcon;
  title: string;
  body: string;
  /** Short points that make the feature concrete; optional */
  points?: string[];
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    icon: "plane",
    title: "Travel Buddy에 오신 걸 환영해요",
    body: "출발 준비부터 여행지의 하루까지, 필요한 순간에 먼저 챙겨 주는 여행 친구예요. 1분이면 둘러볼 수 있어요.",
  },
  {
    id: "course",
    icon: "course",
    title: "날짜만 고르면 코스가 나와요",
    body: "함께 가는 사람과 취향을 고르면 AI가 일차별 코스 초안을 짜 줘요. 마음에 안 들면 직접 고치거나 다시 짤 수 있어요.",
    points: ["동행 유형과 취향 최대 3개 선택", "순서, 시각, 장소를 직접 편집", "AI로 다시 짜기는 하루 5회까지"],
  },
  {
    id: "prep",
    icon: "prep",
    title: "출발 전엔 체크리스트와 서류 보관함",
    body: "여권, 항공권 같은 필수 항목을 챙기고, 서류 사진이나 PDF를 올려 두면 체크리스트가 자동으로 채워져요.",
    points: ["항공권·입장권은 인터넷이 약한 곳에서도 열려요", "체크리스트 항목은 직접 더하고 지울 수 있어요", "여권은 나 혼자만 볼 수 있어요"],
  },
  {
    id: "money",
    icon: "money",
    title: "환율과 여비를 한곳에서",
    body: "엔화 총예산을 정하면 하루 권장액을 알려 줘요. 여비는 원화로 얼마인지 같이 보이고, 태그로 걸러 볼 수 있어요.",
    points: ["빨리 쓸 때만 먼저 알려 줘요", "#식비 같은 카테고리와 #닉네임 태그", "환율은 참고용 기준환율이에요"],
  },
  {
    id: "nudge",
    icon: "nudge",
    title: "필요한 순간에 먼저 물어봐요",
    body: "노선도 아래에 작은 알림이 떠요. 확인을 눌러야만 실행되고, 지나가도 괜찮아요.",
    points: [
      "아침·저녁 안내와 다음 장소 길찾기",
      "주변 명소, 항공권과 입장권 꺼내기",
      "교통패스·입장권·할인권 추천(마이리얼트립 검색)",
    ],
  },
  {
    id: "together",
    icon: "together",
    title: "함께 가는 사람과 같이 봐요",
    body: "초대 링크를 보내면 같은 일정을 함께 볼 수 있어요. 체크리스트는 각자 챙기고 여비는 합쳐서 기록해요.",
    points: ["링크는 7일 동안 쓸 수 있어요", "서류는 파일마다 나눌지 정해요", "코스와 예산은 주인만 바꿔요"],
  },
  {
    id: "start",
    icon: "start",
    title: "준비됐어요!",
    body: "먼저 여행을 하나 만들어 볼까요? 이 소개는 내 여행 화면에서 언제든 다시 볼 수 있어요.",
  },
];
