# X Clone - Production-Ready Twitter/X Clone (Portfolio & QA Project)

A fully functional, responsive, and installable Progressive Web App (PWA) Twitter/X clone built with React, Tailwind CSS, and Firebase. This project serves as a showcase for clean React architecture, real-time Firestore sync, client-side image optimization, role-based admin controls, and a professional, comprehensive suite of manual QA testing documentation.

---

## 🚀 Key Features

### Frontend & Application Architecture
- **Responsive Layout**: Adheres to modern Twitter/X grid designs. Displays Left Sidebar, Timeline feed, and Right Sidebar on desktop, and a sticky header, timeline feed, and Bottom Navigation on mobile.
- **PWA Capabilities**: Installable directly to desktops and mobile screens. Implements Service Workers, caching strategies, and offline page fallback.
- **Dark Mode**: Fully supports Dark and Light themes, syncing seamlessly with browser preferences and persisting selection in localStorage.
- **Optimized Performance**: Router code splitting via `React.lazy`, memoization, loading skeletons, and real-time state pagination.

### Firebase Backend Services
- **Firebase Auth**: Supports secure sign-up, sign-in, and password reset flows with detailed input validations and Google provider integration.
- **Firestore Database**: Real-time notifications count, timeline feed rendering, follow relationship updates, atomic liking checks, and bookmarks.
- **Firebase Storage**: Media attachment uploads with client-side image compression (HTML5 Canvas scaling) and uploading progress tracking.

### Admin Dashboard & Content Moderation
- **Security & Roles**: Banned users are denied credentials validation and logged out automatically. Admin pages are restricted to `role == 'admin'`.
- **Content Moderation**: Review pending flags and choose to delete violating posts or dismiss reports.
- **User Management**: Control platform access with ban/unban controls.

---

## 📂 Project Folder Structure

```text
src/
├── assets/         # App logos, fallbacks, default pictures
├── components/     # Reusable UI elements (Button, Sidebar, TweetBox, PostCard, Skeleton, Dialog, ErrorBoundary)
│   ├── layout/     # DesktopLayout, MobileLayout, StickyHeader, Sidebar, BottomNav
│   ├── feedback/   # ErrorState, EmptyState, LoadingSkeleton, ProgressBar
│   ├── post/       # PostCard, CommentModal, ReportModal, TweetBox
│   └── common/     # Button, Input, Modal, Avatar, Tooltip
├── context/        # React context (AuthContext, ThemeContext, NotificationContext)
├── firebase/       # Firebase client config and initialization
├── hooks/          # Custom hooks (useAuth, usePosts, useNotifications, useTheme, useInfiniteScroll)
├── pages/          # Auth (Login, Register, ForgotPassword), Feed, Profile, Bookmarks, Notifications, Search/Explore, Settings, Admin, NotFound
├── services/       # Firestore, Storage, and Auth interface layers
├── styles/         # Global styles (Tailwind config, index.css)
└── utils/          # Helpers (imageCompressor, dateUtils, validators, seoUtils)
QA/                 # QA documentation output directory (Excel, Word files)
QA_generator/       # Python scripts to compile advanced QA docs
```

---

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/x-clone.git
   cd x-clone
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and enter your Firebase SDK details:
   ```bash
   cp .env.example .env
   ```
4. **Run the local development server**:
   ```bash
   npm run dev
   ```
5. **Build the production bundle**:
   ```bash
   npm run build
   ```

---

## 🛡️ Firebase Configuration
For instructions on setting up Firebase Authentication, Firestore Database rules, and Cloud Storage credentials, refer to the [Firebase Setup Guide](docs/firebase_setup.md).

---

## 📈 Deployment
For guidelines on deploying the app to Cloudflare Pages or Firebase Hosting, check out the [Deployment Guide](docs/deployment.md).

---

## 🧪 Manual QA Testing Documentation
This project contains a comprehensive manual testing folder `/QA` containing 200+ detailed test cases across functional, boundary, performance, compatibility, accessibility, security, regression, and smoke test plans.
For more details, check [Test Plan](QA/TestPlan.docx) and [Requirements Specification](QA/Requirements.docx).

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
