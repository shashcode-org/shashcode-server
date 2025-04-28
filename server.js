require('dotenv').config(); // add at the very top

const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5000;

// Secure CORS - Allow only your frontend URL
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(bodyParser.json());


app.use(helmet());


// Initialize Razorpay using env variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// API: Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({ orderId: order.id, amount: order.amount });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// API: Verify Razorpay Payment
app.post('/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSignature) {
      res.json({ status: 'ok' });
    } else {
      res.status(400).json({ status: 'error' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ status: 'error' });
  }
});

// healthcheck api
app.get('/', (req, res) => {
    res.send('Server is running 🚀');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
