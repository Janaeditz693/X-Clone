# Deployment Guide

Follow this guide to deploy your Twitter/X Clone app to either Firebase Hosting or Cloudflare Pages.

## Option A: Deploy to Cloudflare Pages (Recommended)
Cloudflare Pages is the fastest and easiest method to deploy frontend applications from GitHub.

1. Commit and push your code to a GitHub repository.
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** > **Create application** > **Pages**.
3. Connect your GitHub account and select your repository.
4. Configure your build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
5. Go to the **Environment variables** tab under **Settings** and add your Firebase credentials matching your `.env` keys.
6. Click **Save and Deploy**.

---

## Option B: Deploy to Firebase Hosting
Deploy directly from your CLI using Firebase tools.

1. Install the Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in using your Google Account credentials:
   ```bash
   firebase login
   ```
3. Initialize the hosting setup in the root workspace:
   ```bash
   firebase init hosting
   ```
   - Choose **Use an existing project** and select your project.
   - Configure the public directory: **`dist`**.
   - Configure as a single-page app: **`Yes`** (important for routing).
   - Set up automatic builds/deploys with GitHub: **`No`**.
4. Build and deploy the production bundle:
   ```bash
   npm run build
   firebase deploy
   ```
