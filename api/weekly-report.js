import { callClaude, sendEmail, getSupabase, emailTemplate } from './_email.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const db = getSupabase()

  try {
    const allLeads = await db.select('leads', 'select=*')
    const leads = Array.isArray(allLeads) ? allLeads : []

    const stats = {
      total:          leads.length,
      hot:            leads.filter(l => l.score >= 75).length,
      warm:           leads.filter(l => l.score >= 50 && l.score < 75).length,
      cold:           leads.filter(l => l.score < 50).length,
      won:            leads.filter(l => l.status === 'won').length,
      pipeline_value: leads.filter(l => !['won','lost','dead'].includes(l.status))
                          .reduce((s, l) => s + parseInt(l.deal_value || 0), 0),
      revenue_won:    leads.filter(l => l.status === 'won')
                          .reduce((s, l) => s + parseInt(l.deal_value || 0), 0),
    }

    const report = await callClaude(`
      Write a Monday morning pipeline report for Revvr sales team.
      Total: ${stats.total}, Hot: ${stats.hot}, Warm: ${stats.warm}, Cold: ${stats.cold},
      Won: ${stats.won}, Pipeline: ₹${stats.pipeline_value.toLocaleString('en-IN')}, Revenue: ₹${stats.revenue_won.toLocaleString('en-IN')}
      3-4 bullet points + one action. Under 150 words.
    `, 400)

    const htmlBody = report.split('\n\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('')

    await sendEmail({
      to: process.env.GMAIL_USER,
      subject: `📊 Weekly pipeline — ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`,
      html: emailTemplate(`
        <div class="badge">Monday 8am Report</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
          <div style="background:#fff0ec;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#ff4d1c;">${stats.hot}</div>
            <div style="font-size:12px;color:#d93a0c;font-weight:600;">Hot leads</div>
          </div>
          <div style="background:#e0f7f5;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#0d9488;">₹${(stats.pipeline_value/100000).toFixed(1)}L</div>
            <div style="font-size:12px;color:#0a7060;font-weight:600;">Pipeline</div>
          </div>
        </div>
        ${htmlBody}
        <a href="https://revvr.app/dashboard" class="cta">View dashboard →</a>
      `),
    })

    return new Response(JSON.stringify({ success: true, stats }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
