# Wanderlust - Major Project

A full-featured travel & property listing web application built with **Node.js**, **Express.js**, **EJS**, **Passport.js**, and **PostgreSQL** with **Prisma ORM**.

## Features
- **User Authentication**: Passport Local strategy with password hashing.
- **Listings CRUD**: Create, read, update, and delete property listings with image uploads (Cloudinary) and forward geocoding.
- **Reviews CRUD**: Add and delete reviews on listings.
- **Session Management**: Session store with Prisma & PostgreSQL.
- **Deployment**: Ready for free hosting on Vercel with PostgreSQL databases like Supabase or Neon.

## ⚠️ Security Notice & Secret Rotation Warning
> [!WARNING]
> If any API keys, database connection strings, Cloudinary credentials, or session secrets were previously hardcoded or committed to git history prior to secret cleanup, **those credentials remain accessible in Git commit history**.
> 
> **Immediate Action Required**: Rotate all credentials (Cloudinary API secrets, Geoapify tokens, Database passwords, Session secrets) in their respective provider consoles immediately to ensure full security.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```env
   DATABASE_URL="your_postgresql_connection_string"
   DIRECT_URL="your_postgresql_direct_connection_string"
   CLOUD_NAME="your_cloudinary_name"
   CLOUD_API_KEY="your_cloudinary_key"
   CLOUD_API_SECRET="your_cloudinary_secret"
   MAP_TOKEN="your_geoapify_token"
   SECRET="your_session_secret"
   ```

3. **Initialize Database & Seed**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Start Application**:
   ```bash
   npm start
   ```
