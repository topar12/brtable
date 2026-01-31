# 반려식탁 (Remix 스타일 React Router)

`guide.md`를 기반으로 만든 영양 중심 웹앱 MVP입니다. 현재는 UI 전용(Mock)으로 사용자 흐름 검증을 목표로 합니다.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## MVP 라우트

- `/` 홈
- `/onboarding` 프로필 온보딩
- `/calculator` RER/DER 및 혼합 급여 계산기
- `/products` 사료 리스트
- `/products/:id` 사료 상세
- `/compare` 비교
- `/admin` 운영 플레이스홀더

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## 참고

- Mock 데이터는 `app/data/mock.ts`
- 계산 유틸은 `app/utils/calc.ts`

## 데이터베이스 연결

1. `.env`에 `DATABASE_URL` 설정
2. Prisma 클라이언트 생성

```bash
npx prisma generate
```

마이그레이션은 스키마 확정 후 진행하세요.

## Supabase REST 연동 (IPv6/Direct DB 없이)

브라우저에서 Supabase REST를 사용합니다. 아래 환경변수만 설정하면
앱이 자동으로 Supabase 데이터를 불러오고, 실패 시 Mock으로 전환합니다.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

현재 연결 기준 테이블/컬럼 예시:

- `dog_breeds`: `id`, `slug`, `name_ko`, `name_en`, `aliases`, `popularity_rank`
- `Product`: `id`, `brand`, `name`, `crudeProtein`, `crudeFat`, `crudeFiber`, `crudeAsh`, `crudeMoisture`, `caloriesPer100g` 또는 `caloriesEstimatedPer100g`, `caloriesSource`, `mainProtein`, `targetConditions`
- `ProductSKU`: `id`, `productId`, `weight`, `price`

메모:
- 현재 화면은 강아지 기준으로 표시됩니다.
- `targetConditions`는 화면에서 원재료/특징 태그로 노출됩니다.

---

Built with ❤️ using React Router.
