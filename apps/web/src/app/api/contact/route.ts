import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Spam honeypot detection
    if (body.website_url_hp) {
      console.warn('Spam submission intercepted by honeypot.');
      return NextResponse.json({ success: true }); // Silent drop for bots
    }

    const { name, email, category, message } = body;
    if (!name || !email || !message) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    console.log(`✉️ [Orbitly Contact Form Dispatch] From: ${name} (${email}) | Cat: ${category} | Msg: ${message}`);

    return NextResponse.json({
      success: true,
      message: 'Contact form message received successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
