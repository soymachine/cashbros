# CashBros Setup Guide

## 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project", name it `cashbros` (or similar)
3. Disable Google Analytics (not needed) and create the project

## 2. Enable Email/Password Authentication

1. In the Firebase console, go to **Build > Authentication**
2. Click "Get started"
3. Under **Sign-in method**, enable **Email/Password**
4. Save

## 3. Create Firestore Database

1. Go to **Build > Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode**
4. Select your preferred region and finish

### Firestore Security Rules

Replace the default rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all profiles, only write their own
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    // Authenticated users can read all transactions
    // Only the payer can delete their own transaction
    match /transactions/{txId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.payerId;
      allow update: if false;
    }
  }
}
```

## 4. Create the Two User Accounts

1. In **Authentication > Users**, click "Add user":
   - Email: `bro1@cashbros.app`, Password: (choose a strong password)
2. Add a second user:
   - Email: `bro2@cashbros.app`, Password: (choose a strong password)

> Note: User profiles in Firestore are created automatically on first login based on the email prefix (`bro1` → cyan/💻, `bro2` → orange/🎨).

## 5. Get Firebase Config

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll to "Your apps" and click "Add app" > Web (`</>`)
3. Register the app (name it `cashbros-web`)
4. Copy the `firebaseConfig` object values

## 6. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 7. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173/cashbros/](http://localhost:5173/cashbros/) and log in with `bro1@cashbros.app` or `bro2@cashbros.app`.

## 8. Deploy to GitHub Pages

### 8a. Add GitHub Secrets

In your GitHub repo, go to **Settings > Secrets and variables > Actions** and add these repository secrets:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 8b. Enable GitHub Pages

1. Go to **Settings > Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

### 8c. Push to main

```bash
git push origin main
```

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will build and deploy automatically. The app will be live at:

```
https://<your-github-username>.github.io/cashbros/
```

## 9. Add Firebase Authorized Domain

After deploying, add the GitHub Pages domain to Firebase Auth's authorized domains:

1. Go to **Authentication > Settings > Authorized domains**
2. Add: `<your-github-username>.github.io`

## Data Model Reference

```
users/{uid}:
  name: "Hermano 1" | "Hermano 2"
  username: "bro1" | "bro2"
  color: "cyan" | "orange"
  emoji: "💻" | "🎨"

transactions/{transactionId}:
  amount: number
  description: string
  category: "general"|"software"|"infraestructura"|"marketing"|"diseño"|"reunión"|"otro"
  type: "expense" | "settlement"
  payerId: string  (Firebase Auth UID)
  payerName: string
  createdAt: Timestamp
```
