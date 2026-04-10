# Revvr.app — Deployment Guide

## Folder structure
```
revvr.app/
├── index.html          ← Homepage (revvr.app)
├── dashboard.html      ← Client dashboard (revvr.app/dashboard)
├── login.html          ← Magic link login (revvr.app/login)
├── demo.html           ← Live AI demo (revvr.app/demo)
├── blog.html           ← Blog (revvr.app/blog)
├── vercel.json         ← Routing config (do not delete)
├── supabase-setup.sql  ← Run this in Supabase SQL Editor once
└── README.md           ← This file
```

## Before deploying — update these 2 lines

In **dashboard.html** and **login.html**, find and replace:
```
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'
```
With your real values from: supabase.com → Settings → API

## Deploy to Vercel (5 steps)

1. Go to vercel.com → New Project
2. Import from GitHub (push this folder to GitHub first)
   OR drag-and-drop this entire folder into Vercel
3. Framework: Other (static)
4. Root directory: ./ (the revvr.app folder itself)
5. Click Deploy

## Connect revvr.app domain

1. In Vercel → your project → Settings → Domains
2. Add: revvr.app
3. Add: www.revvr.app
4. Vercel gives you DNS records → add them in your domain registrar
5. Wait 10–30 minutes → site is live at https://revvr.app

## Update Supabase Auth settings

After deploying, go to supabase.com → Auth → Settings:
- Site URL: https://revvr.app
- Redirect URLs add:
  - https://revvr.app/dashboard
  - https://revvr.app/login

## Client flow (how it works)

1. Client visits revvr.app
2. Clicks "Get started" → fills form → submits
3. Redirected to revvr.app/login with their email pre-filled
4. Clicks "Send magic link" → email arrives
5. Clicks link in email → auto-redirected to revvr.app/dashboard
6. Dashboard loads their real pipeline from Supabase

## URLs

| Page        | URL                        |
|-------------|----------------------------|
| Homepage    | https://revvr.app          |
| Dashboard   | https://revvr.app/dashboard|
| Login       | https://revvr.app/login    |
| Demo        | https://revvr.app/demo     |
| Blog        | https://revvr.app/blog     |
| Support     | hello@revvr.app            |
