export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { package: pkg } = req.body;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Payment config error' });
  }

  const priceMap = {
    starter:   4900,
    basic:     9900,
    pro:      19900,
    unlimited: 49900
  };

  const amount = priceMap[pkg];
  if (!amount) return res.status(400).json({ error: 'Invalid package' });

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `nexus_${pkg}_${Date.now()}`,
        notes: { package: pkg }
      })
    });

    const order = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: order.error?.description || 'Order creation failed' });
    }

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
