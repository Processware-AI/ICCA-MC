import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('결제 완료:', event.data.object.id);
      // Firestore 결제 상태 업데이트 로직 추가 가능
      break;
    case 'payment_intent.payment_failed':
      console.log('결제 실패:', event.data.object.id);
      break;
  }

  return NextResponse.json({ received: true });
}
