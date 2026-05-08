# HR WebApp Starter Code for Antigravity

Bộ source này giúp Antigravity/Vibe Code xây dựng nhanh từ 28 màn hình HR App tham chiếu.

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000` để xem danh sách 28 màn hình.

## Cấu trúc

```txt
app/
  page.tsx
  screens/[slug]/page.tsx
components/ui.tsx
modules/screens/        # 28 màn hình, mỗi màn hình 1 file
lib/mock-data.ts        # mock 150 nhân sự và dữ liệu module
lib/screen-registry.ts  # registry route + metadata
services/hr-api.ts      # service layer thay mock bằng Supabase
services/supabase-client.ts
public/reference-screens/ # 28 ảnh gốc
```

## Handoff cho Antigravity

- Không gộp 28 màn hình vào một file.
- Mọi dữ liệu đi qua `services/hr-api.ts`.
- Thay từng mock function bằng Supabase query.
- Tách component lặp lại vào `components/`.
- Giữ UI premium blue, text tiếng Việt.
