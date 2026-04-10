# Revvr Automation Setup Guide
## No Make.com needed — Claude AI + Gmail + Vercel

---

## How it all connects

```
Homepage form submitted
        ↓
/api/speed-to-lead.js (Vercel)
        ↓
Claude AI writes personalised email
        ↓
Gmail sends it to the lead
        ↓
Lead saved to Supabase
        ↓
You get a notification email

Daily at 9am → /api/daily-followups.js  → Day 3,7,14 emails
Monday 8am  → /api/weekly-report.js     → Pipeline report email
Monday 10am → /api/cold-reactivation.js → Cold lead emails
Supabase DB → /api/hot-lead-alert.js    → Score 75+ alert email
Razorpay    → /api/client-onboarding.js → New client welcome email
```

---

## STEP 1 — Get your Gmail App Password (2 minutes)

Normal Gmail password does NOT work. You need an App Password.

1. Go to: myaccount.google.com/security
2. Turn ON "2-Step Verification" if it's off
3. Go back to Security → scroll down → click "App passwords"
4. Select app: Mail → Select device: Other → type "Revvr"
5. Click Generate
6. Copy the 16-character password (example: abcd efgh ijkl mnop)
7. Save it — you can only see it once!

---

## STEP 2 — Add Environment Variables in Vercel (3 minutes)

Go to: vercel.com → your revvr project → Settings → Environment Variables

Add these 5 variables one by one:

| Variable Name  | Value |
|----------------|-------|
| GMAIL_USER     | hello@revvr.app (or your Gmail) |
| GMAIL_PASS     | the 16-char app password from Step 1 |
| ANTHROPIC_KEY  | sk-ant-api03-... (from console.anthropic.com) |
| SUPABASE_URL   | https://xxxx.supabase.co |
| SUPABASE_KEY   | your service_role key (from Supabase Settings → API) |

For each variable:
- Click "Add New"
- Type the name exactly as shown
- Paste the value
- Select: Production, Preview, Development (tick all three)
- Click Save

---

## STEP 3 — Set up Supabase Webhook for hot lead alerts (5 minutes)

This fires /api/hot-lead-alert the moment any lead score hits 75+

1. Go to supabase.com → your project
2. Click "Database" in left sidebar
3. Click "Webhooks"
4. Click "Create a new webhook"
5. Fill in:
   - Name: Hot Lead Alert
   - Table: leads
   - Events: tick UPDATE only
   - URL: https://revvr.app/api/hot-lead-alert
   - HTTP method: POST
6. Click "Create webhook"

Now whenever a lead's score is updated to 75+ (by Make.com, dashboard, or anything), 
you get an instant alert email.

---

## STEP 4 — Set up Razorpay webhook for client onboarding (5 minutes)

1. Go to dashboard.razorpay.com
2. Settings → Webhooks → + Add New Webhook
3. Fill in:
   - Webhook URL: https://revvr.app/api/client-onboarding
   - Secret: create any secret string (save it)
   - Events: tick "payment.captured"
4. Click Save

Now every payment auto-creates the client account and sends them a magic link.

IMPORTANT: When creating your Razorpay payment link, add these "Notes" fields:
- name → client's name
- company → company name
- plan → starter / growth / enterprise

---

## STEP 5 — Deploy to Vercel (2 minutes)

Option A — Drag and Drop (easiest):
1. Go to vercel.com → New Project
2. Drag your entire revvr.app folder onto the page
3. Click Deploy
4. Done!

Option B — GitHub (recommended for updates):
1. Create a GitHub repo named "revvr-app"
2. Push your revvr.app folder to it
3. In Vercel → New Project → Import Git Repository → select revvr-app
4. Click Deploy
5. Every time you push to GitHub, Vercel auto-deploys

---

## STEP 6 — Connect revvr.app domain (5 minutes)

1. Vercel → your project → Settings → Domains
2. Click "Add Domain"
3. Type: revvr.app → click Add
4. Type: www.revvr.app → click Add
5. Vercel shows you DNS records to add
6. Go to your domain registrar (GoDaddy, Namecheap etc.)
7. Add the DNS records Vercel gives you
8. Wait 10-30 minutes → revvr.app is live!

---

## How the 6 automations run

| Automation | Trigger | How often |
|---|---|---|
| Speed to lead | Homepage form submitted | Instantly, every time |
| Day 3/7/14 followups | Vercel Cron | Every morning 9am IST |
| Hot lead alert | Supabase webhook | Instantly when score hits 75+ |
| Cold reactivation | Vercel Cron | Every Monday 10am IST |
| Weekly report | Vercel Cron | Every Monday 8am IST |
| Client onboarding | Razorpay webhook | Instantly on payment |

---

## Test each automation manually

After deploying, test each one by visiting these URLs:

Speed to lead (fill homepage form) → automatic
Daily followups → https://revvr.app/api/daily-followups
Weekly report  → https://revvr.app/api/weekly-report
Cold reactivation → https://revvr.app/api/cold-reactivation
Hot lead alert → update a lead score to 80 in Supabase

---

## Emails your clients and you will receive

Leads receive:
- Day 1: Personalised intro email from Claude AI
- Day 3: Different angle followup
- Day 7: Strategic question email
- Day 14: Gentle final followup
- Cold: Fresh reactivation email (if no response in 30 days)

You receive:
- Instant: New lead notification
- Instant: Hot lead alert (score 75+)
- Instant: New client payment notification
- Every Monday 8am: Full pipeline report with metrics
- Every day: Followup summary (how many sent)

---

## Support
Email: hello@revvr.app
Dashboard: revvr.app/dashboard
