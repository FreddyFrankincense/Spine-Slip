import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: "2mb" }));

  // Live Grounded Retailer Scan for an existing release (Prices + Disc Contents + Discrepancies + Early Promo Audit)
  app.post("/api/radar/scan", async (req, res) => {
    try {
      const { title, label, editionType, format, msrp, targetPrice, spineNumber } = req.body;
      if (!title || !label) {
        res.status(400).json({ error: "Missing title or boutique label." });
        return;
      }

      const ai = getGenAIClient();
      const prompt = `Search current online physical media storefronts and retailers for "${title}" (${label} - ${spineNumber || ""} ${editionType || "Collector Edition"}, ${format || "4K UHD / Blu-ray"}).
Check:
1. Direct boutique label or production company/distributor store (${label} — including A24 Shop, NEON Direct, Lionsgate Limited, Criterion, Vinegar Syndrome, Arrow, Shout! Factory, Second Sight, etc.)
2. Specialty physical media stockists (DiabolikDVD, OrbitDVD, Grindhouse Video)
3. Major mass-market retailers (Amazon, Gruv / Gruvi [Gruv.com], Target, Barnes & Noble, Walmart, Best Buy)

Provide a comprehensive collector intelligence report covering:
- Current lowest verified prices across boutique/distributor direct, specialty stockists, and major retailers including Gruv (Gruvi), Amazon, Target, and Barnes & Noble (compare against MSRP $${msrp || 49.99} and collector target price $${targetPrice || 29.99}).
- Scraped disc contents across retailers: all film cuts/versions & runtimes (Director's Cut, Extended Cut, Theatrical, International Cut), audio commentaries, on-disc special features/documentaries, and physical promotional materials (rolled posters, enamel pins, lobby cards, hardback books, booklets, zines).
- Cross-retailer content discrepancy check: Flag if different websites list different disc counts, cuts, or packaging under the same title/SKU/UPC (e.g., Amazon, Gruv, or Target listing a 1-disc Standard Theatrical Edition while A24 Shop, NEON, DiabolikDVD, or Direct lists the multi-disc Director's Cut / Limited Edition).
- Early / pre-purchase promo material audit: Identify whether early/pre-order promotional bonuses (like Shout! Factory rolled lithograph posters & pins, A24/NEON first-wave zines & feelies, Vinegar Syndrome/Severin pre-order items, or Arrow/Kino first-pressing booklets & slipcovers) are excluded in later print runs or sales even though the edition/spine/UPC number remains identical.

Also include a JSON block at the very end wrapped in \`\`\`json ... \`\`\` using this exact structure:
{
  "summary": "2-sentence synthesis of current stock, disc contents, and best price",
  "slipcoverAlert": "Current packaging/print status note",
  "discrepancyNote": "Detailed note on any content/disc/packaging variance found between retailers (or confirmation that listings match)",
  "earlyPromoNote": "Audit of early/pre-purchase promo bonuses (posters, pins, booklets) vs later sale print runs sharing the same edition number",
  "scrapedDiscContents": {
    "discCountSummary": "e.g., 2-Disc Set (1x 4K UHD + 1x Blu-ray)",
    "cutsIncluded": ["Theatrical Cut (98 mins)", "Director's Extended Cut (109 mins)"],
    "commentaries": ["Audio commentary by the director", "Audio commentary by film historians"],
    "specialFeatures": ["Archival making-of documentary", "New cast/crew interviews", "Theatrical trailers & TV spots"],
    "includedPromoMaterials": ["First-pressing collector booklet", "Direct-store exclusive rolled lithograph poster (early runs only)"]
  },
  "offers": [
    {
      "retailer": "Retailer Name (e.g. Gruv (Gruvi), DiabolikDVD, OrbitDVD, Amazon, Barnes & Noble, Direct Label Store, Target)",
      "retailerCategory": "Boutique Direct" | "Specialty Stockist" | "Major Retailer",
      "price": 34.99,
      "inStock": true,
      "stockNote": "Brief note on slipcover/box availability or sale discount",
      "isSale": true,
      "listedDiscCount": "2-Disc 4K + BD",
      "promoBonusStatus": "Early poster/booklet status at this retailer",
      "hasListingDiscrepancy": false
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text ?? "";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources = chunks
        .map((c: any) => ({
          uri: c?.web?.uri || "",
          title: c?.web?.title || "Verified Retailer Source",
        }))
        .filter((s: { uri: string }) => Boolean(s.uri));

      let parsedData: {
        summary?: string;
        slipcoverAlert?: string;
        discrepancyNote?: string;
        earlyPromoNote?: string;
        scrapedDiscContents?: {
          discCountSummary?: string;
          cutsIncluded?: string[];
          commentaries?: string[];
          specialFeatures?: string[];
          includedPromoMaterials?: string[];
        };
        offers?: Array<{
          retailer: string;
          retailerCategory: "Boutique Direct" | "Specialty Stockist" | "Major Retailer";
          price: number;
          inStock: boolean;
          stockNote: string;
          isSale: boolean;
          listedDiscCount?: string;
          promoBonusStatus?: string;
          hasListingDiscrepancy?: boolean;
        }>;
      } = {};

      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsedData = JSON.parse(jsonMatch[1].trim());
        } catch {
          // Fallback to clean text if JSON block parsing fails
        }
      }

      const cleanReport = rawText.replace(/```json[\s\S]*?```/g, "").trim();

      res.json({
        reportText: cleanReport || parsedData.summary || "Live retailer check completed.",
        summary: parsedData.summary || cleanReport.slice(0, 220),
        slipcoverAlert: parsedData.slipcoverAlert || null,
        discrepancyNote: parsedData.discrepancyNote || null,
        earlyPromoNote: parsedData.earlyPromoNote || null,
        scrapedDiscContents: parsedData.scrapedDiscContents || null,
        offers: Array.isArray(parsedData.offers) ? parsedData.offers : [],
        sources,
        checkedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in /api/radar/scan:", error);
      res.status(500).json({
        error:
          error?.message ||
          "Unable to complete live retailer scan. Check your API key in Settings > Secrets.",
      });
    }
  });

  // Live Grounded Discovery for adding any new boutique release to the Vault
  app.post("/api/radar/discover", async (req, res) => {
    try {
      const { query, preferredLabel, targetPrice } = req.body;
      if (!query) {
        res.status(400).json({ error: "Please provide a film title, spine number, or edition query." });
        return;
      }

      const ai = getGenAIClient();
      const searchResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Research the physical media collector release for: "${query}" ${
          preferredLabel ? `(Label preference: ${preferredLabel})` : ""
        }.
Find accurate details on:
1. Boutique label or production company/distributor (Criterion, Vinegar Syndrome, Arrow Video, Second Sight, Shout! Factory, Severin, Kino Lorber, A24, NEON, Lionsgate Limited, 88 Films, Radiance, Umbrella, Indicator, Deaf Crocodile, Eureka, Mondo Macabro, Terror Vision, Grindhouse Releasing, BFI), director, release year, spine/catalog number, and edition packaging.
2. Complete on-disc contents: number of discs, film cuts/versions included (Theatrical, Director's Cut, Extended, International), audio commentaries, archival special features/interviews, and physical promotional materials (posters, pins, booklets, zines, lobby cards).
3. Cross-retailer listing discrepancies: whether mass-market stores (Amazon, Gruv / Gruvi [Gruv.com], Target, Walmart, Barnes & Noble) list a Standard re-issue or fewer discs under the same title/SKU compared to DiabolikDVD, OrbitDVD, or the label/distributor's direct store (e.g. A24 Shop, NEON Direct).
4. Early / pre-purchase promo policy: whether early pre-order promos (rolled posters, enamel pins, first-pressing booklets/slips/zines) are excluded in later print runs or sales while keeping the same edition/catalog number.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const groundedContext = searchResponse.text ?? "";
      const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources = chunks
        .map((c: any) => ({
          uri: c?.web?.uri || "",
          title: c?.web?.title || "Retailer Listing",
        }))
        .filter((s: { uri: string }) => Boolean(s.uri));

      const structuredResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Based on the following live research for "${query}", return a structured JSON object for our physical media collector vault.
Research context:
${groundedContext}

User's target buy price preference: ${targetPrice ? `$${targetPrice}` : "auto-calculate ~30% below MSRP"}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              director: { type: Type.STRING },
              year: { type: Type.INTEGER },
              label: { type: Type.STRING },
              spineNumber: { type: Type.STRING },
              editionType: {
                type: Type.STRING,
                description: "One of: Rigid Box Set, Limited Slipcover, Boutique Steelbook, Archival Digipak, Standard Edition",
              },
              format: {
                type: Type.STRING,
                description: "One of: 4K UHD + Blu-ray, 4K UHD, Blu-ray",
              },
              hdr: {
                type: Type.STRING,
                description: "One of: Dolby Vision / HDR10, HDR10, SDR (Restored 4K Master)",
              },
              region: {
                type: Type.STRING,
                description: "One of: Region Free, Region A, Region B, Region A/B/C",
              },
              audio: { type: Type.STRING },
              slipcoverStatus: {
                type: Type.STRING,
                description: "One of: In Stock (With Slip), Low Slip Stock (<10%), Rigid Box Active, Standard Only (Slip OOP), Near OOP",
              },
              totalUnits: { type: Type.INTEGER },
              remainingEstimate: { type: Type.INTEGER },
              msrp: { type: Type.NUMBER },
              recommendedTargetPrice: { type: Type.NUMBER },
              collectorNotes: { type: Type.STRING },
              discContents: {
                type: Type.OBJECT,
                properties: {
                  discCountSummary: { type: Type.STRING },
                  cutsIncluded: { type: Type.ARRAY, items: { type: Type.STRING } },
                  commentaries: { type: Type.ARRAY, items: { type: Type.STRING } },
                  specialFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                  includedPromoMaterials: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  "discCountSummary",
                  "cutsIncluded",
                  "commentaries",
                  "specialFeatures",
                  "includedPromoMaterials",
                ],
              },
              retailerDiscrepancy: {
                type: Type.OBJECT,
                properties: {
                  hasDiscrepancy: { type: Type.BOOLEAN },
                  severity: {
                    type: Type.STRING,
                    description: "One of: Critical SKU / Cut Variance, Packaging / Bonus Variance, Verified Identical",
                  },
                  affectedRetailers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  summary: { type: Type.STRING },
                  verificationAdvice: { type: Type.STRING },
                },
                required: [
                  "hasDiscrepancy",
                  "severity",
                  "affectedRetailers",
                  "summary",
                  "verificationAdvice",
                ],
              },
              earlyPromoPolicy: {
                type: Type.OBJECT,
                properties: {
                  sameEditionNumberWarning: { type: Type.BOOLEAN },
                  catalogIdentifierNote: { type: Type.STRING },
                  earlyPromoItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                  laterRunOmissions: { type: Type.STRING },
                  activePromoRetailer: { type: Type.STRING },
                },
                required: [
                  "sameEditionNumberWarning",
                  "catalogIdentifierNote",
                  "earlyPromoItems",
                  "laterRunOmissions",
                  "activePromoRetailer",
                ],
              },
              offers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    retailer: { type: Type.STRING },
                    retailerCategory: {
                      type: Type.STRING,
                      description: "One of: Boutique Direct, Specialty Stockist, Major Retailer",
                    },
                    price: { type: Type.NUMBER },
                    inStock: { type: Type.BOOLEAN },
                    stockNote: { type: Type.STRING },
                    isSale: { type: Type.BOOLEAN },
                    listedDiscCount: { type: Type.STRING },
                    promoBonusStatus: { type: Type.STRING },
                    hasListingDiscrepancy: { type: Type.BOOLEAN },
                  },
                  required: ["retailer", "retailerCategory", "price", "inStock", "stockNote", "isSale"],
                },
              },
            },
            required: [
              "title",
              "director",
              "year",
              "label",
              "spineNumber",
              "editionType",
              "format",
              "hdr",
              "region",
              "audio",
              "slipcoverStatus",
              "msrp",
              "recommendedTargetPrice",
              "collectorNotes",
              "discContents",
              "retailerDiscrepancy",
              "earlyPromoPolicy",
              "offers",
            ],
          },
        },
      });

      const structuredItem = JSON.parse((structuredResponse.text ?? "{}").trim());

      res.json({
        release: structuredItem,
        groundedSummary: groundedContext,
        sources,
      });
    } catch (error: any) {
      console.error("Error in /api/radar/discover:", error);
      res.status(500).json({
        error:
          error?.message ||
          "Failed to discover release via live search. Check your API key in Settings > Secrets.",
      });
    }
  });

  // 4-Layer Anti-Spam Verified Promo & Ad Campaign Code Scanner
  app.post("/api/radar/promo-codes", async (req, res) => {
    try {
      const { retailerOrLabel } = req.body;
      const targetScope = retailerOrLabel || "Gruv (Gruvi), OrbitDVD, Arrow Video, Shout! Factory, Target, Barnes & Noble";

      const COUPON_FARM_BLOCKLIST = [
        "dealspotr.com",
        "couponbirds.com",
        "wethrift.com",
        "simplycodes.com",
        "retailmenot.com",
        "dontpayfull.com",
        "knoji.com",
        "promocodes.com",
        "coupert.com",
        "couponfollow.com",
        "hotdeals.com",
      ];

      const ai = getGenAIClient();
      const searchResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Perform a strict, anti-spam physical media promo code and advertising campaign verification for: "${targetScope}".

CRITICAL ANTI-SLOP & SOURCE ALLOWLIST RULES:
1. NEVER trust or cite generic SEO coupon-aggregator farms (${COUPON_FARM_BLOCKLIST.map((d) => `-site:${d}`).join(" ")}).
2. ONLY verify promo codes, multi-buy promotions, or shipping codes that come from:
   - Tier 1 (Official Storefront Banners, FAQ/Shipping Policies, Newsletter Welcome Codes, or Official Podcast/YouTube Ad Campaigns) — e.g., Gruv.com's SIGNUP20, OrbitDVD's 3FREE, Arrow Video / Shout! Factory newsletter or horror podcast codes, Target Circle B2G1 / 15% entertainment promos, A24 AAA24 member discounts.
   - Tier 2 (Collector-Verified Physical Media Deal Forums) — e.g., reddit.com/r/4kbluray, reddit.com/r/boutiquebluray, or blu-ray.com/deals threads where collectors confirm the code works at checkout.
3. If a retailer/label (such as DiabolikDVD, The Criterion Collection, or Second Sight) NEVER issues public reusable percent-off promo codes, explicitly state that policy and flag any third-party coupon-site codes for that store as 100% fake.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const groundedContext = searchResponse.text ?? "";
      const rawChunks =
        searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

      let blockedCount = 0;
      const verifiedSources = rawChunks
        .map((c: any) => ({
          uri: c?.web?.uri || "",
          title: c?.web?.title || "Verified Campaign / Collector Source",
        }))
        .filter((s: { uri: string }) => {
          if (!s.uri) return false;
          const lowerUri = s.uri.toLowerCase();
          const isSpam = COUPON_FARM_BLOCKLIST.some((domain) =>
            lowerUri.includes(domain)
          );
          if (isSpam) {
            blockedCount += 1;
            return false;
          }
          return true;
        });

      const structuredResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Based on the following verified physical media promo & campaign research for "${targetScope}", return a structured JSON report.
Only include promo codes that are genuinely verified by official storefront policies, official ad/podcast campaigns, or collector forums (r/4kbluray, r/boutiquebluray, Blu-ray.com). Do NOT invent fake codes.

Research context:
${groundedContext}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              policySummary: {
                type: Type.STRING,
                description: "Summary of official promo code & campaign rules for the queried retailer(s) and warning against fake aggregator codes",
              },
              rejectedFakePatterns: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Examples of fake or expired coupon-farm codes/claims collectors should ignore for this retailer",
              },
              verifiedCodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    code: { type: Type.STRING },
                    retailer: { type: Type.STRING },
                    discountSummary: { type: Type.STRING },
                    discountType: {
                      type: Type.STRING,
                      description: "One of: Percent Off, Flat Dollar Off, Free Shipping / Multi-Buy",
                    },
                    discountPercent: { type: Type.NUMBER },
                    discountFlat: { type: Type.NUMBER },
                    verificationTier: {
                      type: Type.STRING,
                      description: "One of: Tier 1 — Official Storefront Policy, Tier 1 — Official Ad / Newsletter Campaign, Tier 2 — Collector Forum Verified (r/4kbluray · Blu-ray.com)",
                    },
                    campaignSource: { type: Type.STRING },
                    stackingAndExclusions: { type: Type.STRING },
                    excludesLimitedBoxes: { type: Type.BOOLEAN },
                    confidenceScore: { type: Type.INTEGER },
                  },
                  required: [
                    "code",
                    "retailer",
                    "discountSummary",
                    "discountType",
                    "verificationTier",
                    "campaignSource",
                    "stackingAndExclusions",
                    "confidenceScore",
                  ],
                },
              },
            },
            required: ["policySummary", "rejectedFakePatterns", "verifiedCodes"],
          },
        },
      });

      const parsed = JSON.parse((structuredResponse.text ?? "{}").trim());

      res.json({
        policySummary:
          parsed.policySummary ||
          "Completed source-allowlisted promo & campaign verification.",
        rejectedFakePatterns: Array.isArray(parsed.rejectedFakePatterns)
          ? parsed.rejectedFakePatterns
          : [],
        verifiedCodes: Array.isArray(parsed.verifiedCodes)
          ? parsed.verifiedCodes
          : [],
        sources: verifiedSources,
        blockedAggregatorCount: blockedCount,
        checkedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in /api/radar/promo-codes:", error);
      res.status(500).json({
        error:
          error?.message ||
          "Failed to scan verified promo campaigns. Check your API key in Settings > Secrets.",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: false,
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "."),
        },
      },
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
        watch: null,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Spine & Slip server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
