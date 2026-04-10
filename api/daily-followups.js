import { callClaude, sendEmail, getSupabase, emailTemplate } from './_email.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const db = getSupabase()
  const results = { day3: 0, day7: 0, day14: 0, errors: [] }
  const today = new Date().toISOString().split('T')[0]

  try {
    for (const dayNum of [3, 7, 14]) {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - dayNum)
      const targetDate = daysAgo.toISOString().split('T')[0]

      const leads = await db.select('leads',
        `last_followup_date=eq.${targetDate}&replied=eq.false&status=not.in.(won,lost,dead)&select=*`
      )

      if (!Array.isArray(leads) || !leads.length) continue

      for (const lead of leads) {
        try {
          const ai = await callClaude(`
            Write a Day ${dayNum} B2B sales followup email for Revvr.
            Lead: ${lead.name} at ${lead.company}
            Different angle — do NOT mention Day ${dayNum}. Under 100 words.
            Format: SUBJECT: [line]\nBODY: [body]
          `, 300)

          const subject = ai.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s)?.[1]?.trim() || `Following up — ${lead.company}`
          const body    = ai.match(/BODY:\s*([\s\S]+)/)?.[1]?.trim() || ai
          const html    = body.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')

          await sendEmail({
            to: lead.email,
            subject,
            html: emailTemplate(`<p>Hi ${lead.name?.split(' ')[0]},</p>${html}<a href="https://revvr.app#cta" class="cta">Book a demo →</a>`),
          })

          await db.update('leads', { last_followup_date: today }, { id: `eq.${lead.id}` })
          await db.insert('followups', {
            lead_id: lead.id, client_id: lead.client_id,
            day_number: dayNum, type: 'followup', message_sent: body, channel: 'email',
          })
          results[`day${dayNum}`]++
        } catch (e) {
          results.errors.push({ lead: lead.email, error: e.message })
        }
      }
    }

    const total = results.day3 + results.day7 + results.day14
    if (total > 0) {
      await sendEmail({
        to: process.env.GMAIL_USER,
        subject: `📧 Daily followups: ${total} emails sent`,
        html: emailTemplate(`
          <div class="badge">Daily report</div>
          <p>Day 3: <strong>${results.day3}</strong> · Day 7: <strong>${results.day7}</strong> · Day 14: <strong>${results.day14}</strong></p>
          <a href="https://revvr.app/dashboard" class="cta">View dashboard →</a>
        `),
      })
    }

    return new Response(JSON.stringify({ success: true, results }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
