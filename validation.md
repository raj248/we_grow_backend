Great question 🔑 — verifying purchases is **required** if you’re selling IAPs (especially subscriptions) because otherwise people can spoof receipts.

Since you’re asking for **Node.js**, let’s cover **Google Play** (Android) first, then briefly touch **Apple** (iOS).

---

# 🔹 1. Google Play Purchase Verification (Node.js)

Google provides the **Google Play Developer API**. You can verify purchases by calling:

```
GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/products/{productId}/tokens/{purchaseToken}
```

- **packageName** → your app package (e.g. `com.myapp.example`)
- **productId** → product ID (`coin_10`)
- **purchaseToken** → from the purchase object (`purchase.purchaseToken` in `expo-iap`)

---

## Steps in Node.js

### 1. Install Google API client

```bash
npm install googleapis
```

### 2. Create a Service Account

- In [Google Cloud Console](https://console.cloud.google.com/), create a **service account** with access to the **Google Play Android Developer API**.
- Download the JSON key file.

### 3. Verify a purchase in Node.js

```js
import { google } from "googleapis";
import fs from "fs";

// Load service account key
const keyFile = "./google-play-service-account.json";

// Initialize JWT auth
const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

// Create API client
const androidPublisher = google.androidpublisher({
  version: "v3",
  auth,
});

/**
 * Verify Google Play purchase
 */
async function verifyGooglePurchase(packageName, productId, purchaseToken) {
  try {
    const res = await androidPublisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });

    console.log("Purchase verification result:", res.data);

    if (res.data.purchaseState === 0) {
      // ✅ Purchased
      return { valid: true, data: res.data };
    } else {
      // ❌ Not purchased / canceled / pending
      return { valid: false, data: res.data };
    }
  } catch (err) {
    console.error("Google Play verification failed:", err);
    return { valid: false, error: err };
  }
}

// Example usage
verifyGooglePurchase(
  "com.myapp.example", // your app package
  "coin_10", // product ID
  "purchase-token-here" // from Expo IAP purchase object
).then(console.log);
```

---

# 🔹 2. Apple Purchase Verification (iOS)

For iOS, you send the `transactionReceipt` to Apple’s **verifyReceipt** endpoint:

- **Sandbox:** `https://sandbox.itunes.apple.com/verifyReceipt`
- **Production:** `https://buy.itunes.apple.com/verifyReceipt`

### Example (Node.js)

```js
import fetch from "node-fetch";

async function verifyApplePurchase(receiptData) {
  const response = await fetch("https://buy.itunes.apple.com/verifyReceipt", {
    method: "POST",
    body: JSON.stringify({
      "receipt-data": receiptData,
      password: "YOUR_SHARED_SECRET", // from App Store Connect
    }),
    headers: { "Content-Type": "application/json" },
  });

  const result = await response.json();
  console.log("Apple verification result:", result);

  if (result.status === 0) {
    return { valid: true, data: result };
  } else {
    return { valid: false, data: result };
  }
}
```

---

# 🔑 Summary

- **Google Play (Android):**
  Use `googleapis` package → call `purchases.products.get()` with `packageName`, `productId`, and `purchaseToken`.
- **Apple (iOS):**
  Send `transactionReceipt` to Apple’s `verifyReceipt` API with your app’s shared secret.
- **Server is required** for real security — validating purchases only in-app is unsafe.

---

⚡ Next step:
Do you want me to write a **minimal Express.js backend** with endpoints `/verify/google` and `/verify/apple` so your Expo app can send receipts there for verification?
