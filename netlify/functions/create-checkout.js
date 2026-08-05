// This function runs on Netlify's servers, not in the browser.
// That's required because your Stripe SECRET key must never be exposed to visitors.
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { items } = JSON.parse(event.body);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty' }) };
    }

    // Load the product catalog from disk (server-side copy) so prices
    // always come from YOUR source of truth, never from the browser.
    const productsPath = path.join(__dirname, 'products.json');
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

    const line_items = [];
    for (const { id, qty } of items) {
      const product = products.find((p) => p.id === id);
      if (!product) continue;
      const quantity = Math.max(1, Math.min(qty, product.stock));
      if (quantity <= 0) continue;

      line_items.push({
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: product.price, // price in cents
          product_data: {
            name: product.name,
            description: product.description
          }
        }
      });
    }

    if (line_items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No valid items' }) };
    }

    const origin = event.headers.origin || `https://${event.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'BD', 'AU'] // edit to match where you ship
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 500, currency: 'usd' }, // $5 flat shipping, edit as needed
            display_name: 'Standard shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 7 }
            }
          }
        }
      ],
      success_url: `${origin}/success.html`,
      cancel_url: `${origin}/`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong creating checkout.' })
    };
  }
};
