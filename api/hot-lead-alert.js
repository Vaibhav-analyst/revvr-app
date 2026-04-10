import { sendEmail, getSupabase, emailTemplate } from './_email.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const payload = await req.json()
    const lead = payload.record || payload

    if (!lead.score || lead.score < 75) {
      return new Response(JSON.stringify({ skipped: 'Score below threshold' }), { status: 200 })
    }

    const db = getSupabase()
    const urgency = lead.score >= 90 ? '🔥🔥🔥' : lead.score >= 80 ? '🔥🔥' : '🔥'
    const label   = lead.score >= 90 ? 'EXTREMELY HOT' : lead.score >= 80 ? 'Very hot' : 'Hot'

    await sendEmail({
      to: process.env.GMAIL_USER,
      subject: `${urgency} ${label}: ${lead.name} scored ${lead.score}/100`,
      html: emailTemplate(`
        <div class="badge">${urgency} Hot lead alert</div>
        <p><strong>Contact them now!</strong></p>
        <p><strong>Name:</strong> ${lead.name}<br>
        <strong>Company:</strong> ${lead.company || 'N/A'}<br>
        <strong>Email:</strong> ${lead.email}<br>
        <strong>Score:</strong> ${lead.score}/100<br>
        <strong>Deal value:</strong> ₹${parseInt(lead.deal_value || 0).toLocaleString('en-IN')}</p>
        <a href="https://revvr.app/dashboard" class="cta">View in dashboard →</a>
      `),
    })

    await db.update('leads', { status: 'hot' }, { id: `eq.${lead.id}` })

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
