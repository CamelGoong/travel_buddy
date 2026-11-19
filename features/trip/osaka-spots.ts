// Well-known Osaka sights and food streets offered as nearby spots, apart from the course draft.
// Coordinates checked against OpenStreetMap Nominatim and Wikipedia (2026-11-19).

export type OsakaSpot = { key: string; name: string; lat: number; lng: number };

export const OSAKA_SPOTS: OsakaSpot[] = [
  { key: "hozenji-yokocho", name: "호젠지 요코초", lat: 34.66797, lng: 135.50332 },
  { key: "namba-yasaka-shrine", name: "난바 야사카 신사", lat: 34.66148, lng: 135.49673 },
  { key: "amerikamura", name: "아메리카무라", lat: 34.67209, lng: 135.49795 },
  { key: "den-den-town", name: "덴덴타운", lat: 34.65922, lng: 135.50582 },
  { key: "glico-sign", name: "글리코 러너 간판", lat: 34.66893, lng: 135.50105 },
  { key: "namba-grand-kagetsu", name: "난바 그랜드 카게쓰", lat: 34.66496, lng: 135.5037 },
  { key: "namba-parks", name: "난바 파크스", lat: 34.66168, lng: 135.50208 },
  { key: "hep-five-ferris-wheel", name: "HEP FIVE 대관람차", lat: 34.70406, lng: 135.50038 },
  { key: "grand-front-osaka", name: "그랜드 프런트 오사카", lat: 34.70396, lng: 135.49474 },
  { key: "osaka-tenmangu", name: "오사카 덴마구", lat: 34.69609, lng: 135.51277 },
  { key: "central-public-hall", name: "나카노시마 중앙공회당", lat: 34.69354, lng: 135.50401 },
  { key: "osaka-station-city", name: "오사카 스테이션 시티", lat: 34.70221, lng: 135.49557 },
  { key: "hankyu-umeda-main-store", name: "우메다 한큐 백화점", lat: 34.70271, lng: 135.49843 },
  { key: "osaka-museum-of-history", name: "오사카 역사박물관", lat: 34.68262, lng: 135.52081 },
  { key: "miraiza-osaka-jo", name: "미라이자 오사카성", lat: 34.68585, lng: 135.52648 },
  { key: "nishinomaru-garden", name: "오사카성 니시노마루 정원", lat: 34.6871, lng: 135.52312 },
  { key: "osaka-jo-hall", name: "오사카조 홀", lat: 34.68964, lng: 135.5301 },
  { key: "otemon-gate", name: "오사카성 오테몬", lat: 34.68508, lng: 135.52304 },
  { key: "sakuramon-gate", name: "오사카성 사쿠라몬", lat: 34.68522, lng: 135.5257 },
  { key: "tennoji-zoo", name: "텐노지 동물원", lat: 34.65064, lng: 135.50836 },
  { key: "spa-world", name: "스파월드", lat: 34.65017, lng: 135.50557 },
  { key: "tennoji-tenshiba", name: "텐노지 공원 텐시바", lat: 34.64863, lng: 135.51088 },
  { key: "keitakuen-garden", name: "게이타쿠엔 정원", lat: 34.64971, lng: 135.51142 },
  { key: "isshinji-temple", name: "잇신지", lat: 34.65264, lng: 135.51183 },
  { key: "abeno-qs-mall", name: "아베노 큐즈 몰", lat: 34.64436, lng: 135.51221 },
  { key: "santa-maria-cruise", name: "산타마리아 크루즈", lat: 34.65505, lng: 135.42829 },
  { key: "universal-citywalk", name: "유니버설 시티워크 오사카", lat: 34.66828, lng: 135.43759 },
  { key: "tempozan-harbor-village", name: "덴포잔 하버빌리지", lat: 34.65638, lng: 135.43118 },
  { key: "cosmo-tower", name: "사키시마 코스모 타워 전망대", lat: 34.63813, lng: 135.41484 },
  { key: "maishima-incineration-plant", name: "마이시마 소각장 (훈데르트바서)", lat: 34.66562, lng: 135.40651 },
];
