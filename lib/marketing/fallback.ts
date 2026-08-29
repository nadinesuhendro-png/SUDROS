// PATH: lib/marketing/fallback.ts
// AKSI: BUAT FILE BARU (fallback engine deterministic — tidak pernah gagal, tidak butuh AI sama sekali)

export type MarketingListingFacts = {
  title: string;
  price: number;
  locationCity: string;
  locationArea: string;
  categoryName: string;
  description: string;
  listingUrl: string;
};

export type MarketingContentOutput = {
  headline: string;
  hook: string;
  caption: string;
  short_copy: string;
  video_script: string;
  cta: string;
  hashtags: string[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

function location(facts: MarketingListingFacts) {
  return facts.locationArea
    ? `${facts.locationArea}, ${facts.locationCity}`
    : facts.locationCity;
}

function keyFacts(facts: MarketingListingFacts) {
  const parts = [formatPrice(facts.price), location(facts)];
  if (facts.categoryName) parts.push(facts.categoryName);
  return parts.join(" • ");
}

const CTA_DEFAULT = "Lihat detail lengkap listing ini di SUDROS.";

export function generateFallbackContent(
  facts: MarketingListingFacts,
  platform: "instagram" | "facebook" | "tiktok" | "whatsapp" | "general"
): MarketingContentOutput {
  const base: MarketingContentOutput = {
    headline: "",
    hook: "",
    caption: "",
    short_copy: "",
    video_script: "",
    cta: CTA_DEFAULT,
    hashtags: [],
  };

  const hashtagBase = ["sudros", "jualbeli", "listinglokal"];
  if (facts.categoryName) {
    hashtagBase.push(facts.categoryName.toLowerCase().replace(/\s+/g, ""));
  }
  if (facts.locationCity) {
    hashtagBase.push(facts.locationCity.toLowerCase().replace(/\s+/g, ""));
  }

  switch (platform) {
    case "instagram": {
      base.headline = facts.title;
      base.caption = `🏠 ${facts.title}\n\n📍 ${location(facts)}\n💰 ${formatPrice(
        facts.price
      )}\n\n${facts.description ? facts.description + "\n\n" : ""}${CTA_DEFAULT}`;
      base.hashtags = hashtagBase.slice(0, 5);
      break;
    }
    case "facebook": {
      base.headline = facts.title;
      base.caption = `${facts.title}\n\n📍 Lokasi: ${location(
        facts
      )}\n💰 Harga: ${formatPrice(facts.price)}\n\n${
        facts.description ? facts.description + "\n\n" : ""
      }${CTA_DEFAULT}`;
      break;
    }
    case "tiktok": {
      base.hook = `Cari ${facts.categoryName || "barang"} di ${
        facts.locationCity
      }?`;
      base.video_script = `Ini salah satu listing yang tersedia di SUDROS.\n\n${facts.title} — ${keyFacts(
        facts
      )}\n\n${CTA_DEFAULT}`;
      base.caption = `${facts.title} • ${keyFacts(facts)}`;
      base.hashtags = hashtagBase.slice(0, 5);
      break;
    }
    case "whatsapp": {
      base.short_copy = `Halo! Ada listing menarik nih:\n\n🏠 ${facts.title}\n💰 ${formatPrice(
        facts.price
      )}\n📍 ${location(facts)}\n\n${CTA_DEFAULT}\n${facts.listingUrl}`;
      break;
    }
    case "general":
    default: {
      base.headline = facts.title;
      base.caption = `${facts.title}\n\n${keyFacts(facts)}\n\n${CTA_DEFAULT}`;
      break;
    }
  }

  return base;
}
