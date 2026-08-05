# ChitFund App — Local VS Code Setup & Deployment Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18 + | https://nodejs.org |
| pnpm | 8 + | `npm i -g pnpm` |
| Supabase CLI | latest | `npm i -g supabase` |
| Deno | 1.40 + | https://deno.land/#installation |

---

## 1 — Clone / Open the Project

Open the project folder in VS Code.  
All files are already wired to your live Supabase project at:  
`https://suyazakfpyhwethhvszg.supabase.co`

---

## 2 — Install Dependencies

```bash
pnpm install
```

---

## 3 — Environment Variables

A `.env` file is already included with your live credentials.  
If you ever rotate your keys, update `.env`:

```
VITE_SUPABASE_URL=https://suyazakfpyhwethhvszg.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_SUPABASE_PROJECT_ID=suyazakfpyhwethhvszg
```

---

## 4 — Run the Frontend (Dev Server)

```bash
pnpm dev
```

Opens at **http://localhost:5173**

---

## 5 — Deploy the Edge Function (Backend)

The backend is a Supabase Edge Function (Deno + Hono) located at:  
`supabase/functions/server/index.tsx`

### One-time login
```bash
supabase login
```

### Link to your project
```bash
supabase link --project-ref suyazakfpyhwethhvszg
```

### Deploy the function
```bash
supabase functions deploy make-server-ca64c5bf --no-verify-jwt
```

> The function is already live on Figma Make's Supabase instance.  
> Re-deploying will push any local changes you make.

---

## 6 — Production Build

```bash
pnpm build
```

Output goes to `dist/`. Deploy that folder to any static host:

| Host | Deploy command |
|------|---------------|
| **Vercel** | `vercel --prod` (after `npm i -g vercel`) |
| **Netlify** | Drag `dist/` to netlify.com/drop |
| **GitHub Pages** | Push `dist/` to `gh-pages` branch |
| **Firebase** | `firebase deploy` |

For Vercel/Netlify, set these environment variables in the dashboard:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_PROJECT_ID
```

---

## Project Structure

```
/
├── index.html                        ← Vite entry point
├── src/
│   ├── main.tsx                      ← React bootstrap
│   ├── app/
│   │   ├── App.tsx                   ← Root component + auth state
│   │   ├── contexts/
│   │   │   └── LanguageContext.tsx   ← 20-language i18n
│   │   ├── i18n/
│   │   │   └── translations.ts       ← All translation strings
│   │   └── components/
│   │       ├── LoginPage.tsx
│   │       ├── Sidebar.tsx
│   │       ├── ChitGroupCard.tsx
│   │       ├── ChitGroupDetails.tsx
│   │       ├── CreateChitGroupDialog.tsx
│   │       ├── AddMemberDialog.tsx
│   │       ├── PaymentDialog.tsx     ← UPI QR + GPay/PhonePe/Paytm
│   │       ├── LanguageSelector.tsx
│   │       ├── pages/
│   │       │   ├── PaymentsPage.tsx
│   │       │   ├── ProfilePage.tsx
│   │       │   ├── MyChitsPage.tsx
│   │       │   ├── KycPage.tsx
│   │       │   └── PaymentStatusPage.tsx
│   │       └── ui/                   ← shadcn/ui components
│   └── styles/
│       ├── index.css
│       ├── theme.css
│       ├── tailwind.css
│       └── fonts.css
├── supabase/
│   ├── config.toml                   ← Supabase CLI config
│   └── functions/
│       └── server/
│           ├── index.tsx             ← Hono API (auth, groups, payments…)
│           └── kv_store.tsx          ← KV store utility (do not edit)
├── utils/
│   └── supabase/
│       ├── info.tsx                  ← Hardcoded project ID + anon key
│       └── client.tsx                ← Supabase singleton client
├── public/
│   └── favicon.svg
├── .env                              ← Live credentials (don't commit)
├── .env.example
├── .gitignore
├── package.json
├── vite.config.ts
└── postcss.config.mjs
```

---

## Key Features

- **Auth** — Email/phone login, signup, forgot password with 6-digit code, token persistence
- **Chit Groups** — Create, view, manage groups with member roles (Admin/Member)
- **Payments** — UPI QR code + GPay / PhonePe / Paytm deep-link redirect
- **Contributions** — Auto-saved on every confirmed payment
- **Bidding** — Place bids, resolve winners, track history
- **Profile** — Change password, 2FA setup
- **i18n** — 20 languages (12 Indian + 8 international) with RTL support
- **Role gating** — Admin vs Member features controlled via localStorage

---

## Recommended VS Code Extensions

- **ESLint** — `dbaeumer.vscode-eslint`
- **Prettier** — `esbenp.prettier-vscode`
- **Tailwind CSS IntelliSense** — `bradlc.vscode-tailwindcss`
- **TypeScript** — built-in
- **Deno** — `denoland.vscode-deno` (for edge function editing)
