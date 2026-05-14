import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, username, email } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const slackToken = process.env.SLACK_BOT_TOKEN;
  if (!slackToken) {
    return NextResponse.json({ error: 'Slack not configured' }, { status: 500 });
  }

  const reporter = username ? `@${username}${email ? ` (${email})` : ''}` : 'Anonymous';

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${slackToken}` },
    body: JSON.stringify({
      channel: 'proj-webapp-stagd',
      text: `🐛 *Bug Report — Stag'd*\n*From:* ${reporter}\n\n${message}`,
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('Slack error:', data.error);
    return NextResponse.json({ error: data.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
