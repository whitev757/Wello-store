# General Goods — your free store

This is a real, working e-commerce site: product grid, cart, and checkout that
actually charges cards and collects shipping addresses via Stripe. Total cost
to run it is **$0** — the only money that ever moves is Stripe's standard
processing fee (around 2.9% + $0.30), and that's only deducted *from sales you
actually make*, never charged to you upfront.

Follow these steps in order. None of them cost anything.

---

## 1. Put the code on GitHub (free)

1. Go to https://github.com and create a free account if you don't have one.
2. Click **New repository**, name it something like `my-store`, keep it
   **Public** or **Private** (either works), click **Create repository**.
3. On the new repo page, click **uploading an existing file** and drag in
   every file and folder from this `store` folder (keep the folder structure —
   `netlify/functions/` must stay nested).
4. Click **Commit changes**.

## 2. Deploy to Netlify (free hosting)

1. Go to https://netlify.com and sign up free (you can sign up with your
   GitHub account, which makes step 2 easier).
2. Click **Add new site → Import an existing project**.
3. Choose GitHub, and pick the `my-store` repo you just created.
4. Netlify will detect `netlify.toml` automatically. Leave settings as-is and
   click **Deploy**.
5. In a minute or two, you'll get a free live URL like
   `https://your-store-name.netlify.app` — that's your actual live site.

## 3. Set up Stripe (free — takes payments)

1. Go to https://stripe.com and create a free account.
2. Once in the Stripe Dashboard, make sure you're in **Test mode** (toggle,
   top right) while we set things up.
3. Go to **Developers → API keys**. Copy the **Secret key** (starts with `sk_test_...`).
4. Back in Netlify: go to your site → **Site configuration → Environment
   variables → Add a variable**.
   - Key: `STRIPE_SECRET_KEY`
   - Value: paste the secret key from Stripe
5. Go to **Deploys** and click **Trigger deploy → Deploy site** so the new
   variable takes effect.

## 4. Test it

1. Open your live Netlify URL, add a product to the cart, click **Checkout**.
2. You'll land on a real Stripe Checkout page. Use Stripe's official test
   card: `4242 4242 4242 4242`, any future expiry date, any 3-digit CVC, any
   ZIP.
3. You should be redirected to your confirmation page. Check your Stripe
   Dashboard (Test mode) — the payment will show up there.

## 5. Go live (start accepting real money)

1. In Stripe, finish **Activate your account** (business details, bank
   account for payouts — this is required by law for any payment processor,
   still free to do).
2. Switch Stripe's toggle to **Live mode**, go to **Developers → API keys**,
   copy the **live** secret key (`sk_live_...`).
3. In Netlify, update the `STRIPE_SECRET_KEY` environment variable to the
   live key, then trigger a redeploy.
4. You're now taking real orders.

---

## Editing your product catalog

Open `products.json` (and copy the same edits into
`netlify/functions/products.json` — that copy is what actually sets the
price at checkout, so **always keep both files identical**). Each product
looks like:

```json
{
  "id": "sku-001",
  "name": "Terracotta Plant Pot",
  "description": "Hand-thrown 6\" terracotta pot with drainage hole.",
  "price": 1800,
  "stock": 14,
  "image": "images/product-1.svg"
}
```

- `price` is in **cents** ($18.00 = `1800`).
- `stock` is just a number you update by hand after each sale — this template
  doesn't auto-deduct inventory (see note below).
- `image` — replace the placeholder SVGs in `/images` with real photos
  (JPG/PNG/WebP), then update the path here.
- To add a product, copy a block and give it a unique `id`. To remove one,
  delete its block.

Commit the change on GitHub and Netlify redeploys automatically.

## Shipping and rates

Shipping options live in `netlify/functions/create-checkout.js`, in the
`shipping_options` and `shipping_address_collection` sections. Edit the flat
rate, add more shipping tiers, or change which countries you ship to.

## About inventory

This template keeps things simple and free: stock numbers are informational
only, and won't automatically go down when someone buys. For under 10
products that's easy to manage by hand — just check Stripe's dashboard after
each sale and edit `stock` in both `products.json` files. If you outgrow
that, the next free step up is adding Google Sheets or Firebase as a live
database — happy to help with that when you're ready.

## About a custom domain

Right now your store lives at a free `.netlify.app` address, which costs
nothing. A custom domain like `generalgoods.com` is optional and is the one
piece that isn't free (roughly $10–15/year from a registrar) — everything
else in this stack stays free either way.

## Order notifications

Stripe automatically emails a receipt to the customer, and you can turn on
email notifications for yourself in Stripe under **Settings → Notifications**
so you hear about every sale immediately — no extra cost.
