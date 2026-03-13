require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 건강 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '이카산악회 백엔드 서버 정상 동작 중' });
});

// Stripe PaymentIntent 생성
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'krw', description } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: '유효하지 않은 결제 금액입니다.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      description: description || '이카산악회 결제',
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('PaymentIntent 생성 오류:', error);
    res.status(500).json({ error: '결제 처리 중 오류가 발생했습니다.' });
  }
});

// Stripe 웹훅 (결제 완료 콜백)
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`결제 완료: ${paymentIntent.id}, ${paymentIntent.amount}원`);
      // Firestore 업데이트 로직 추가 가능
      break;
    case 'payment_intent.payment_failed':
      console.log(`결제 실패: ${event.data.object.id}`);
      break;
  }

  res.json({ received: true });
});

// 연회비 결제 처리
app.post('/membership-payment', async (req, res) => {
  try {
    const { userId, userName, year } = req.body;
    const MEMBERSHIP_FEE = 120000; // 12만원

    const paymentIntent = await stripe.paymentIntents.create({
      amount: MEMBERSHIP_FEE,
      currency: 'krw',
      description: `${year}년 연회비 - ${userName}`,
      metadata: { userId, userName, type: 'membership', year: String(year) },
    });

    res.json({ clientSecret: paymentIntent.client_secret, amount: MEMBERSHIP_FEE });
  } catch (error) {
    res.status(500).json({ error: '연회비 결제 처리 중 오류가 발생했습니다.' });
  }
});

// 이벤트 참가비 결제 처리
app.post('/event-payment', async (req, res) => {
  try {
    const { userId, userName, eventId, eventTitle, amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'krw',
      description: `등산 참가비: ${eventTitle} - ${userName}`,
      metadata: { userId, userName, type: 'event', eventId, eventTitle },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: '참가비 결제 처리 중 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`🏔️  이카산악회 서버 실행 중: http://localhost:${PORT}`);
});
