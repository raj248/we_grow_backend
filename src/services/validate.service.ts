import { google } from "googleapis";

// Load your service account JSON key
const auth = new google.auth.GoogleAuth({
  keyFile: "./keys/service-account.json", // path to JSON
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

const androidpublisher = google.androidpublisher({ version: "v3" });

google.options({ auth });

// Verify purchase (in-app product)
export async function verifyAndroidPurchase(
  packageName,
  productId,
  purchaseToken
) {
  try {
    const res = await androidpublisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });

    console.log("Verification result:", res.data);
    return res.data;
  } catch (err) {
    console.error("Error verifying purchase:", err);
    throw err;
  }
}

// consume product
export async function consumeProduct(packageName, productId, purchaseToken) {
  try {
    const res = await androidpublisher.purchases.products.consume({
      packageName,
      productId,
      token: purchaseToken,
    });
    console.log("Consume result:", res.data);
    return res.data;
  } catch (err) {
    console.error("Error consuming product:", err);
    throw err;
  }
}
// Example usage
// verifyAndroidPurchase("com.example.app", "coin_10", "purchaseTokenFromClient");
