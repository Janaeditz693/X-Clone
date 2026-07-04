# Firebase Setup Guide

Follow these steps to configure your own Firebase backend instance for the Twitter/X Clone.

## Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and enter a name (e.g., `x-clone-portfolio`).
3. (Optional) Enable Google Analytics for the project and click **Create project**.

## Step 2: Enable Firebase Authentication
1. In the left-hand sidebar, navigate to **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - Enable **Email/Password**.
   - Enable **Google** (configure your support email).

## Step 3: Set up Cloud Firestore Database
1. Go to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Select your database location.
4. Set rules to start in **test mode** or edit rules using the configuration below.
5. In the **Rules** tab, apply the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /posts/{postId} {
      allow read: if true;
      allow create, update: if request.auth != null;
      allow delete: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    match /likes/{likeId} {
      allow read: if true;
      allow write, delete: if request.auth != null;
    }
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    match /bookmarks/{bookmarkId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write, delete: if request.auth != null;
    }
    match /notifications/{notifId} {
      allow read, write: if request.auth != null;
    }
    match /followers/{followId} {
      allow read: if true;
      allow write, delete: if request.auth != null;
    }
    match /following/{followId} {
      allow read: if true;
      allow write, delete: if request.auth != null;
    }
    match /reports/{reportId} {
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null;
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Step 4: Set up Firebase Storage
1. Go to **Build** > **Storage**.
2. Click **Get Started** and select your server location.
3. In the **Rules** tab, apply the following rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

## Step 5: Setup Project Configurations
1. Go to **Project Settings** (gear icon in sidebar).
2. Register a new Web App (select the `</>` icon).
3. Copy the configuration credentials into your local `.env` file under the respective keys.
