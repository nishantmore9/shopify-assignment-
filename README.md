# Shopify Announcement Task

A MERN stack Shopify app that allows merchants to set an announcement bar from their Admin Dashboard, stores the announcement audit history in MongoDB, and syncs the text to Shopify Storefront Metafields to display it dynamically via a Theme App Extension.

---

## 🛠️ Stack
- **Database**: MongoDB (Audit log) & SQLite (Shopify sessions)
- **Backend**: Node.js / Express / Mongoose
- **Frontend**: React / Shopify Polaris
- **Storefront**: Shopify Theme App Extension (App Embed Block)

---

## 📋 Prerequisites
- **Node.js** (v18+)
- **Shopify Partner Account** & **Development Store**
- **MongoDB connection URI**

---

## ⚙️ Setup & Installation

1. **Install Dependencies** (from `my-app` directory):
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root of the `my-app` directory:
   ```env
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SCOPES=write_products,read_products
   MONGO_URI=mongodb+srv://...
   ```

---

## 💻 Running the App

1. **Start the local server**:
   ```bash
   npm run dev
   ```
   *This links to your Shopify Partner account, boots up a secure tunnel, and starts the React app and Express backend.*

2. **Enable the Storefront Banner**:
   - Go to your Development Store **Online Store** -> **Themes** -> **Customize**.
   - Navigate to **App embeds** on the left sidebar.
   - Toggle **Announcement Bar** to **ON** and click **Save**.

---

## 🔄 Data Flow
1. **Admin Panel**: Enter text in the React/Polaris dashboard and click "Save".
2. **Backend**: Saves the text with a timestamp in MongoDB.
3. **Sync**: Backend updates Shopify's GraphQL metafield: `shop.metafields.my_app.announcement`.
4. **Render**: The Liquid-based App Embed block reads the metafield and displays it floating on storefront pages.
