# Gecko Rack Manager - Expo App

도마뱀붙이(게코) 관리를 위한 크로스플랫폼 모바일 앱입니다.
iOS, Android, Web 모두 지원합니다.

## 주요 기능

- **랙 관리**: 여러 개의 랙을 생성하고 관리
- **게코 관리**: 각 칸에 게코 정보 등록 (이름, 모프, 성별, 체중 등)
- **관리 기록**: 급여, 청소, 탈피, 체중, 메이팅, 산란 등 기록
- **사진 갤러리**: 게코별 여러 장의 사진 관리
- **체중 그래프**: 체중 변화 추이 시각화
- **게코 이동**: 길게 누르기 → 이동할 위치 탭으로 쉽게 이동/교환
- **상태 표시**: 관리가 필요한 게코 시각적 표시 (초록/빨강)

## 기술 스택

- **Frontend**: React Native + Expo
- **Navigation**: Expo Router
- **State**: React Context
- **Storage**: Expo SecureStore (토큰)
- **HTTP Client**: Axios
- **Charts**: react-native-chart-kit
- **Image Picker**: expo-image-picker

## 프로젝트 구조

```
gecko-rack-expo/
├── app/                      # expo-router 페이지
│   ├── _layout.tsx           # Root layout
│   ├── index.tsx             # 리다이렉트
│   ├── login.tsx             # 로그인/회원가입
│   └── (main)/               # 인증 필요 영역
│       ├── _layout.tsx
│       ├── index.tsx         # 랙 목록 (홈)
│       └── gecko/[id].tsx    # 게코 상세
├── components/
│   ├── RackGrid.tsx          # 랙 그리드 표시
│   ├── GeckoCell.tsx         # 개별 셀 컴포넌트
│   ├── GeckoDetail.tsx       # 게코 정보 표시/수정
│   ├── CareLogSection.tsx    # 관리 기록 섹션
│   ├── PhotoGallery.tsx      # 사진 갤러리
│   ├── WeightChart.tsx       # 체중 그래프
│   └── modals/
│       ├── AddRackModal.tsx  # 랙 생성
│       └── EditRackModal.tsx # 랙 수정/삭제
├── contexts/
│   └── AuthContext.tsx       # 인증 상태 관리
├── services/
│   └── api.ts                # API 클라이언트
├── types/
│   └── index.ts              # TypeScript 타입 정의
└── constants/
    └── config.ts             # 설정 (API URL, 색상)
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 백엔드 서버 실행

별도의 터미널에서 백엔드 서버를 실행해야 합니다:

```bash
cd ../gecko-rack-manager/server
npm run dev
```

### 3. 개발 서버 실행

```bash
npx expo start
```

실행 후:
- `w` - 웹 브라우저에서 열기
- `a` - Android 에뮬레이터/기기에서 열기
- `i` - iOS 시뮬레이터에서 열기

### 4. Expo Go로 테스트 (실제 기기)

1. [Expo Go](https://expo.dev/client) 앱 설치
2. 휴대폰과 컴퓨터가 같은 WiFi에 연결
3. `constants/config.ts`에서 `LOCAL_IP`를 컴퓨터 IP로 수정
4. Expo Go에서 QR 코드 스캔 또는 URL 직접 입력

## 환경 설정

### API URL 설정

`constants/config.ts` 파일에서 설정:

```typescript
// 로컬 개발 시 컴퓨터 IP 주소로 변경
const LOCAL_IP = '192.168.x.x';
```

## 관리 기록 타입

| 타입 | 설명 | 아이콘 |
|------|------|--------|
| FEEDING | 급여 | 🍽️ |
| CLEANING | 청소 | 🧹 |
| SHEDDING | 탈피 | 🦎 |
| WEIGHT | 체중 | ⚖️ |
| MATING | 메이팅 | 💕 |
| LAYING | 산란 | 🥚 |
| OTHER | 기타 | 📝 |

## 게코 이동 방법

1. 이동할 게코를 **길게 누르기** (0.5초)
2. 이동 모드 활성화 알림 확인
3. **빈 칸 탭** → 해당 위치로 이동
4. **다른 게코가 있는 칸 탭** → 위치 교환

## 스크린샷

(추후 추가 예정)

## 관련 프로젝트

- [gecko-rack-manager](https://github.com/ksaw1228/gecko-rack-manager) - 백엔드 서버 + React 웹 클라이언트

## 라이선스

MIT License
