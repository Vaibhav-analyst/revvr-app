import { callClaude, sendEmail, getSupabase, emailTemplate } from './_email.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { name, email, company, team_size, challenge, source } = await req.json()

    if (!name || !email || !company) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const db = getSupabase()

    // Save lead to Supabase
    await db.insert('landing_leads', {
      name, email, company,
      team_size: team_size || '',
      challenge: challenge || '',
      source: source || 'homepage_cta',
      converted: false,
    })

    // Claude writes the Day 1 email
    const aiMessage = await callClaude(`
      Write a professional Day 1 sales followup email for Revvr (B2B AI sales automation).
      Lead: ${name} at ${company}
      Team size: ${team_size || 'unknown'}
      Challenge: ${challenge || 'sales followup and automation'}
      Requirements: warm professional tone, under 150 words, end with CTA to book 30-min demo.
      Format: SUBJECT: [line]\nBODY: [body]
    `, 500)

    const subject = aiMessage.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s)?.[1]?.trim()
      || `Quick question about ${company}'s sales process`
    const messageBody = aiMessage.match(/BODY:\s*([\s\S]+)/)?.[1]?.trim() || aiMessage
    const htmlBody = messageBody.split('\n\n').filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`).join('')

    // Send email to lead
    await sendEmail({
      to: email,
      subject,
      html: emailTemplate(`
        <div class="badge">Revvr — AI Sales Engine</div>
        <p>Hi ${name},</p>
        ${htmlBody}
        <a href="https://revvr.app#cta" class="cta">Book a free 30-min demo →</a>
      `),
    })

    // Notify yourself
    await sendEmail({
      to: process.env.GMAIL_USER,
      subject: `🔥 New lead: ${name} from ${company}`,
      html: emailTemplate(`
        <div class="badge">New lead alert</div>
        <p><strong>Name:</strong> ${name}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Company:</strong> ${company}<br>
        <strong>Challenge:</strong> ${challenge || 'not specified'}</p>
        <a href="https://revvr.app/dashboard" class="cta">View in dashboard →</a>
      `),
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('Speed to lead error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
