import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, package: pkg } = req.body;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return res.status(500).json({ error: 'Payment config error' });

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  const creditsMap = {
    starter: 5,
    basic: 10,
    pro: 25,
    unlimited: 999
  };

  const credits = creditsMap[pkg] || 0;

  return res.status(200).json({
    success: true,
    credits,
    message: `Payment verified! ${credits} credits added.`
  });
}
