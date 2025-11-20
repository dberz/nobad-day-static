// Helper to convert Shopify image references to local or CDN URLs
// Format: shopify://shop_images/filename.jpg -> /images/filename.jpg (local) or CDN fallback

const SHOP_ID = "61255024859"; // Actual shop ID from Shopify

export function shopifyImageUrl(shopifyPath: string): string {
  if (shopifyPath.startsWith("shopify://shop_images/")) {
    const filename = shopifyPath.replace("shopify://shop_images/", "");
    // Icons are at /cdn/shop/files/, main images are at /images/
    if (filename.startsWith("icon_")) {
      return `/cdn/shop/files/${filename}`;
    }
    // Main images stay at /images/
    return `/images/${filename}`;
  }
  if (shopifyPath.startsWith("http")) {
    return shopifyPath;
  }
  // If it's already a local path, return as-is
  if (shopifyPath.startsWith("/")) {
    return shopifyPath;
  }
  return shopifyPath;
}

// Image mappings from the theme export - using actual Shopify CDN
export const HOMEPAGE_IMAGES = {
  hero: shopifyImageUrl("shopify://shop_images/No_Bad_Days_on_the_field.jpg"),
  couple: shopifyImageUrl("shopify://shop_images/Couple_in_Diner.jpg"),
  product: shopifyImageUrl("shopify://shop_images/No_Bad_Days_Rectangle_v2.png"),
  running: shopifyImageUrl("shopify://shop_images/Folks_running_happy.jpg"),
  robin: shopifyImageUrl("shopify://shop_images/02042022_Robin_Portraits0376.jpg"),
  icons: {
    indulge: shopifyImageUrl("shopify://shop_images/icon_induldge.svg"),
    dance: shopifyImageUrl("shopify://shop_images/icon_dance.svg"),
    roll: shopifyImageUrl("shopify://shop_images/icon_roll_799bb970-9fda-4fd8-ad6e-e22c88f5a416.svg"),
    hole: shopifyImageUrl("shopify://shop_images/icon_hole.svg"),
    toast: shopifyImageUrl("shopify://shop_images/icon_toast.png"),
    toke: shopifyImageUrl("shopify://shop_images/icon_toke.svg"),
    journey: shopifyImageUrl("shopify://shop_images/icon_journey.svg"),
    dropIn: shopifyImageUrl("shopify://shop_images/icon_drop_in.svg"),
    taste: shopifyImageUrl("shopify://shop_images/icon_taste.svg"),
    heart: shopifyImageUrl("shopify://shop_images/icon_heart.svg"),
    scales: shopifyImageUrl("shopify://shop_images/icon_scales.png"),
    protect: shopifyImageUrl("shopify://shop_images/icon_protect.svg"),
  }
};

