export async function callClaude(prompt, maxTokens = 400) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

export async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Revvr <hello@revvr.app>`,
      to: [to],
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Email failed: ${JSON.stringify(err)}`)
  }
  return res.json()
}

export function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_KEY
  return {
    async insert(table, data) {
      const res = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    async update(table, data, filter) {
      const params = Object.entries(filter).map(([k,v]) => `${k}=${v}`).join('&')
      const res = await fetch(`${url}/rest/v1/${table}?${params}`, {
        method: 'PATCH',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    async select(table, filter = '') {
      const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      return res.json()
    },
  }
}

export function emailTemplate(body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#f2f2ee;font-family:Arial,sans-serif;}.wrap{max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4de;}.header{background:#0a0a0f;padding:28px 36px;}.brand{font-size:22px;font-weight:800;color:#fff;}.brand em{color:#ff4d1c;font-style:normal;}.body{padding:36px;}.body p{font-size:15px;color:#2d2d3a;line-height:1.75;margin:0 0 16px;}.cta{display:inline-block;margin:8px 0 24px;background:#ff4d1c;color:#fff;padding:13px 28px;border-radius:100px;font-size:14px;font-weight:700;text-decoration:none;}.footer{padding:20px 36px;background:#fafaf7;border-top:1px solid #e4e4de;}.footer p{font-size:12px;color:#6b6b80;margin:0;}.badge{display:inline-block;background:#fff0ec;color:#d93a0c;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;margin-bottom:20px;text-transform:uppercase;}</style></head><body><div class="wrap"><div class="header"><div class="brand">revvr<em>.</em></div></div><div class="body">${body}</div><div class="footer"><p>Sent by Revvr · <a href="https://revvr.app">revvr.app</a></p></div></div></body></html>`
}