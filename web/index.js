// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import mongoose from "mongoose";
import Announcement from "./models/announcement.model.js"
import dotenv from "dotenv";
dotenv.config({
  path: '../.env'
});

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// DB connection
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  // If it's missing, stop the app or throw an error
  throw new Error("FATAL: Database URI is missing!");
}

mongoose.connect(mongoURI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create`);
  }
  res.status(status).send({ success: status === 200, error });
});

// Add the new announcement route here
app.post("/api/announcement", async(req, res) => {
  try {
    const session = res.locals.shopify.session;
    const shop = session.shop;
    const { text } = req.body;
    if(!text){
      return res.status(400).json({
        error: "Announcement text is required."
      })
    }
    const newAnnouncement = new Announcement({ shop , text});
    await newAnnouncement.save();
    console.log(`Saved "${text}" to MongoDB for ${shop}`);

    const client = new shopify.api.clients.Graphql({ session });

    const shopQuery = `
      query {
        shop {
          id
        }
      }
    `;
    const shopResponse = await client.request(shopQuery);
    const shopId = shopResponse.data.shop.id;

    const mutation = `
      mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.request(mutation, {
      variables: {
        metafields: [
          {
            namespace: "my_app",
            key: "announcement",
            type: "single_line_text_field",
            value: text,
            ownerId: shopId,
          },
        ],
      },
    });

    // /** @type {any} */
    // const responseBody = response?.body;
  
    const userErrors = response.data.metafieldsSet.userErrors;

    if (userErrors && userErrors.length > 0) {
      console.error("Shopify Metafield Error:", userErrors);
      return res.status(400).json({ error: "Failed to update Shopify Metafield" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Announcement successfully synced!" 
    });

  } catch (error) {
    console.log("API error:", error);
    res.status(500).json({
      error: "Internal server error"
    })
  }
})

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
