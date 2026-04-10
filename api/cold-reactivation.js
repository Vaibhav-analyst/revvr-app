import { callClaude, sendEmail, getSupabase, emailTemplate } from './_email.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const db = getSupabase()
  let sent = 0, skipped = 0
  const errors = []

  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffDate = cutoff.toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    const leads = await db.select('leads',
      `score=lt.50&status=not.in.(won,lost)&last_contact_date=lt.${cutoffDate}&select=*&order=deal_value.desc&limit=50`
    )

    if (!Array.isArray(leads) || !leads.length) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), { status: 200 })
    }

    for (const lead of leads) {
      if (!lead.email) { skipped++; continue }
      try {
        const ai = await callClaude(`
          Cold lead reactivation email for Revvr. Lead: ${lead.name} at ${lead.company}.
          Fresh angle — never mention time since last contact. Under 80 words.
          Format: SUBJECT: [line]\nBODY: [body]
        `, 250)

        const subject = ai.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s)?.[1]?.trim() || `A thought about ${lead.company}`
        const body    = ai.match(/BODY:\s*([\s\S]+)/)?.[1]?.trim() || ai
        const html    = body.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')

        await sendEmail({
          to: lead.email,
          subject,
          html: emailTemplate(`<p>Hi ${lead.name?.split(' ')[0]},</p>${html}<a href="https://revvr.app#cta" class="cta">Let's talk →</a>`),
        })

        await db.update('leads', { last_contact_date: today }, { id: `eq.${lead.id}` })
        sent++
      } catch (e) {
        errors.push({ lead: lead.email, error: e.message })
      }
    }

    await sendEmail({
      to: process.env.GMAIL_USER,
      subject: `❄️ Cold reactivation: ${sent} emails sent`,
      html: emailTemplate(`
        <div class="badge">Monday reactivation</div>
        <p>Sent: <strong>${sent}</strong> · Errors: <strong>${errors.length}</strong></p>
        <a href="https://revvr.app/dashboard" class="cta">Monitor replies →</a>
      `),
    })

    return new Response(JSON.stringify({ success: true, sent, skipped, errors }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
