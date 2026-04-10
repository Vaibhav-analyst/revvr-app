import { sendEmail, getSupabase, emailTemplate } from './_email.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const payload = await req.json()
    const payment = payload?.payload?.payment?.entity

    if (!payment) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })

    const clientEmail  = payment.email
    const clientName   = payment.notes?.name || 'Valued Client'
    const company      = payment.notes?.company || 'Your Company'
    const plan         = payment.notes?.plan || 'growth'
    const amount       = Math.round(payment.amount / 100)
    const paymentId    = payment.id
    const planName     = { starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' }[plan] || plan

    const db = getSupabase()

    await db.insert('clients', {
      company_name: company, contact_name: clientName,
      contact_email: clientEmail, plan, plan_amount: amount,
      razorpay_payment_id: paymentId, status: 'active',
    })

    await sendEmail({
      to: clientEmail,
      subject: `Welcome to Revvr, ${clientName.split(' ')[0]}!`,
      html: emailTemplate(`
        <div class="badge">Welcome to Revvr</div>
        <p>Hi ${clientName.split(' ')[0]},</p>
        <p>Your payment of <strong>₹${amount.toLocaleString('en-IN')}</strong> for the <strong>${planName} plan</strong> is confirmed!</p>
        <p>Our team will contact you within 24 hours to schedule your onboarding call.</p>
        <a href="https://revvr.app/dashboard" class="cta">Open your dashboard →</a>
      `),
    })

    await sendEmail({
      to: process.env.GMAIL_USER,
      subject: `💰 NEW CLIENT — ${clientName} — ₹${amount.toLocaleString('en-IN')}`,
      html: emailTemplate(`
        <div class="badge">New client payment</div>
        <p><strong>Name:</strong> ${clientName}<br>
        <strong>Company:</strong> ${company}<br>
        <strong>Email:</strong> ${clientEmail}<br>
        <strong>Plan:</strong> ${planName}<br>
        <strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
        <p style="background:#dcfce7;padding:14px;border-radius:10px;">Schedule onboarding within 24 hours!</p>
      `),
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
