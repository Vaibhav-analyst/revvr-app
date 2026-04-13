/**
 * PROPOSAL GENERATOR — /api/generate-proposal
 * Triggered by: dashboard "Generate Proposal" button
 * What it does: Claude writes a full sales proposal for a lead
 */

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { name, company, deal_value, challenge, solution } = await req.json()

    if (!name || !company) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name and company' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const key = process.env.ANTHROPIC_KEY
    if (!key) throw new Error('ANTHROPIC_KEY env var is missing')

    // Claude writes the proposal
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Write a professional B2B sales proposal for Revvr (AI sales automation platform).

Client Details:
- Name: ${name}
- Company: ${company}
- Deal Value: ₹${parseInt(deal_value || 0).toLocaleString('en-IN')} per month
- Their Challenge: ${challenge || 'improving sales followup and lead management'}
- Proposed Solution: ${solution || 'Revvr AI sales automation'}

Write a complete proposal with these sections:
1. Executive Summary (2-3 sentences)
2. Understanding Your Challenge (personalised to their specific problem)
3. Our Proposed Solution (how Revvr solves it specifically for them)
4. What You Get (bullet points: features, automations, support)
5. Expected Results (specific numbers: response rates, revenue recovered)
6. Investment (show the deal value as monthly investment)
7. Next Steps (3 simple steps to get started)

Tone: Professional, confident, warm. Written for Indian B2B market.
Format: Use clear headings and bullet points. Ready to send to client.
Length: 400-600 words.`
        }]
      })
    })

    const data = await res.json()
    const proposal = data.content?.[0]?.text || ''

    if (!proposal) throw new Error('Claude did not return a proposal')

    // Save proposal to Supabase
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/proposals`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          client_name: name,
          company_name: company,
          deal_value: parseInt(deal_value || 0),
          proposal_text: proposal,
          status: 'draft',
        }),
      })
    }

    return new Response(
      JSON.stringify({ success: true, proposal }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )

  } catch (err) {
    console.error('Proposal generator error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}