<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

# 🛒 Electronic E-Commerce Shop with Dashboard

A full-featured, modern e-commerce web application for electronics built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **MySQL**. Includes a complete shopping experience with product browsing, cart & checkout, wishlists, live auctions, user authentication, and a full admin dashboard.

---

## 📸 Features at a Glance

| Feature | Description |
|---|---|
| **Product Catalog** | Browse, filter, sort, and paginate through a rich product catalog organized by categories |
| **Product Search** | Full-text search to quickly find products across the store |
| **Shopping Cart** | Add/remove products, adjust quantities, and view order totals with persistent client-side state |
| **Checkout** | Complete order form with credit card validation, shipping details, and order placement |
| **Wishlist** | Authenticated users can save favorite products to a personal wishlist |
| **Live Auctions** | Real-time auction system with bidding for special products |
| **User Authentication** | Secure login/register with credentials and Google OAuth via NextAuth.js |
| **Admin Dashboard** | Protected admin panel for managing products, categories, orders, and users |
| **Responsive Design** | Fully responsive UI built with Tailwind CSS and DaisyUI components |
| **Image Carousel** | Product image sliders on the homepage and product detail pages |

---

## 🏗️ Tech Stack

### Frontend (Next.js App)
| Technology | Purpose |
|---|---|
| [Next.js 14](https://nextjs.org/) | React framework with App Router, SSR, and server components |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS styling |
| [DaisyUI](https://daisyui.com/) | Tailwind CSS component library |
| [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight client-side state management (cart, wishlist, pagination, sorting) |
| [NextAuth.js](https://next-auth.js.org/) | Authentication (credentials + Google OAuth) |
| [React Hot Toast](https://react-hot-toast.com/) | Toast notifications |
| [React Icons](https://react-icons.github.io/react-icons/) | Icon library |
| [React Slick](https://react-slick.neostack.com/) | Image carousels and sliders |
| [ApexCharts](https://apexcharts.com/) | Dashboard charts and analytics |
| [Headless UI](https://headlessui.com/) | Accessible UI primitives |
| [Flowbite React](https://flowbite-react.com/) | UI components |
| [Zod](https://zod.dev/) | Schema validation |

### Backend (Express API Server)
| Technology | Purpose |
|---|---|
| [Express.js](https://expressjs.com/) | REST API server |
| [Prisma](https://www.prisma.io/) | ORM for database access |
| [MySQL](https://www.mysql.com/) | Relational database |
| [bcrypt.js](https://github.com/dcodeIO/bcrypt.js) | Password hashing |
| [CORS](https://github.com/expressjs/cors) | Cross-origin resource sharing |
| [express-fileupload](https://github.com/richardgirges/express-fileupload) | File upload handling |

---

## 📁 Project Structure

```
ecommerce-website/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage (Hero, Categories, Products)
│   ├── layout.tsx                # Root layout with Header, Footer, Providers
│   ├── globals.css               # Global styles
│   ├── not-found.tsx             # Custom 404 page
│   ├── _zustand/                 # Zustand state stores
│   │   ├── store.ts              # Cart store
│   │   ├── wishlistStore.ts      # Wishlist store
│   │   ├── paginationStore.ts    # Pagination state
│   │   ├── sortStore.ts          # Sort preferences
│   │   └── auctionStore.ts       # Auction state
│   ├── shop/[[...slug]]/         # Shop page with dynamic category filtering
│   ├── product/[productSlug]/    # Single product detail page
│   ├── cart/                     # Shopping cart page
│   ├── checkout/                 # Checkout page with form validation
│   ├── wishlist/                 # User wishlist page
│   ├── auctions/                 # Live auctions listing
│   │   └── [slug]/               # Single auction detail page
│   ├── search/                   # Search results page
│   ├── login/                    # Login page (credentials + Google)
│   ├── register/                 # Registration page
│   ├── (dashboard)/              # Admin dashboard (protected)
│   │   └── admin/
│   │       ├── products/         # Manage products
│   │       ├── categories/       # Manage categories
│   │       ├── orders/           # Manage orders
│   │       └── users/            # Manage users
│   ├── api/                      # Next.js API routes
│   │   ├── auth/                 # NextAuth authentication endpoints
│   │   ├── register/             # User registration endpoint
│   │   └── auctions/             # Auction API endpoints
│   └── actions/                  # Server actions
├── components/                   # Reusable UI components
│   ├── Header.tsx                # Site header with navigation
│   ├── Footer.tsx                # Site footer
│   ├── Hero.tsx                  # Homepage hero banner
│   ├── ProductItem.tsx           # Product card component
│   ├── Products.tsx              # Product grid component
│   ├── Filters.tsx               # Shop filters (price, category, etc.)
│   ├── Pagination.tsx            # Pagination controls
│   ├── SortBy.tsx                # Sort dropdown
│   ├── CartElement.tsx           # Cart item component
│   ├── WishItem.tsx              # Wishlist item component
│   ├── SearchInput.tsx           # Search bar component
│   ├── DashboardSidebar.tsx      # Admin sidebar navigation
│   ├── DashboardProductTable.tsx # Admin product table
│   ├── auctions/                 # Auction-specific components
│   │   ├── AuctionCard.tsx       # Auction card component
│   │   └── BidForm.tsx           # Bid submission form
│   └── ...                       # Many more reusable components
├── server/                       # Express.js backend server
│   ├── app.js                    # Server entry point
│   ├── package.json              # Server dependencies
│   ├── controllers/              # Route controllers
│   ├── routes/                   # API route definitions
│   ├── prisma/                   # Server-side Prisma config
│   └── utills/                   # Server utilities
├── prisma/                       # Prisma schema & migrations
│   ├── schema.prisma             # Database schema definition
│   └── migrations/               # Database migration history
├── utils/                        # Shared utilities
│   ├── db.ts                     # Prisma client singleton
│   ├── schema.ts                 # Zod validation schemas
│   ├── actions.ts                # Utility actions
│   ├── SessionProvider.tsx       # NextAuth session provider
│   ├── categoryFormating.ts      # Category text formatting
│   └── insertDemoData.js         # Demo data seeder script
├── helpers/                      # Helper functions
├── lib/                          # Library utilities
│   └── utils.ts                  # Validation helpers
├── public/                       # Static assets (images, icons)
├── Providers.tsx                 # Client-side providers (Toaster)
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.js             # PostCSS configuration
└── package.json                  # Project dependencies & scripts
```

---

## 🗄️ Database Schema

The application uses **MySQL** with **Prisma ORM**. Key models:

| Model | Description |
|---|---|
| `Product` | Store products with title, price, rating, stock, images, and category |
| `Category` | Product categories with one-to-many relationship to products |
| `User` | User accounts with email, hashed password, and role (user/admin) |
| `Customer_order` | Order records with shipping details, status, and total |
| `customer_order_product` | Join table linking orders to products with quantities |
| `Wishlist` | User wishlist items linking users to products |
| `Auction` | Auction entries linked to products with start/end times and bidding |
| `AuctionProduct` | Standalone auction products with bidding information |
| `Bid` | Individual bids placed by users on auction products |
| `Image` | Additional product images beyond the main image |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** (v18 or later) — [Download](https://nodejs.org/)
- **MySQL** (v8.0 or later) — [Download](https://dev.mysql.com/downloads/)
- **npm** or **yarn** package manager
- **Git** — [Download](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/xohaxed/ecommerce-website.git
cd ecommerce-website
```

### 2. Set Up the Database

Create a MySQL database for the project:

```sql
CREATE DATABASE ecommerce_db;
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/ecommerce_db"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

> **Tip:** Generate a secure `NEXTAUTH_SECRET` by running: `openssl rand -base64 32`

### 4. Install Dependencies

**Frontend (Next.js):**

```bash
npm install
```

**Backend (Express server):**

```bash
cd server
npm install
cd ..
```

### 5. Set Up the Database Schema

Run Prisma migrations to create the database tables:

```bash
npx prisma migrate dev
```

Generate the Prisma client:

```bash
npx prisma generate
```

### 6. Seed Demo Data (Optional)

Populate the database with sample products and categories:

```bash
node utils/insertDemoData.js
```

### 7. Start the Development Servers

**Terminal 1 — Start the Express API server:**

```bash
cd server
npm run dev
```

The API server will start on `http://localhost:3001`.

**Terminal 2 — Start the Next.js frontend:**

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`.

### 8. Open the Application

Visit [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 📜 Available Scripts

### Frontend (Root Directory)

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint for code linting |

### Backend (`/server` Directory)

| Command | Description |
|---|---|
| `npm run dev` | Start the Express server with Nodemon (hot reload) |
| `npm start` | Start the Express server in production mode |

### Prisma Commands

| Command | Description |
|---|---|
| `npx prisma migrate dev` | Run database migrations in development |
| `npx prisma migrate deploy` | Run database migrations in production |
| `npx prisma generate` | Generate/regenerate the Prisma client |
| `npx prisma studio` | Open Prisma Studio (visual database browser) |
| `npx prisma db seed` | Seed the database |

---

## 🔐 Authentication

The application uses **NextAuth.js** for authentication with two providers:

1. **Credentials** — Email and password login with bcrypt-hashed passwords
2. **Google OAuth** — Sign in with Google account (optional, requires OAuth setup)

### User Roles

| Role | Access |
|---|---|
| `user` | Browse products, add to cart, checkout, manage wishlist, place bids |
| `admin` | Full access including admin dashboard for managing products, categories, orders, and users |

---

## 🛣️ API Endpoints

The Express.js backend server exposes the following REST API routes:

| Endpoint | Description |
|---|---|
| `GET /api/products` | Fetch all products |
| `GET /api/categories` | Fetch all categories |
| `GET /api/images/:productId` | Fetch product images |
| `GET /api/main-image` | Manage main product images |
| `GET /api/users` | User management |
| `GET /api/search?query=` | Search products by query |
| `GET/POST /api/orders` | Customer order management |
| `GET/POST /api/order-product` | Order-product relationships |
| `GET /api/slugs/:slug` | Fetch product by slug |
| `GET/POST/DELETE /api/wishlist` | Wishlist management |

---

## 🧰 Key Implementation Details

### State Management
- **Zustand** is used for client-side state with separate stores for:
  - **Cart** (`store.ts`) — Products, quantities, totals
  - **Wishlist** (`wishlistStore.ts`) — Saved products
  - **Pagination** (`paginationStore.ts`) — Current page, items per page
  - **Sorting** (`sortStore.ts`) — Sort field and direction
  - **Auctions** (`auctionStore.ts`) — Auction state

### Form Validation
- **Client-side** validation using custom regex validators in `lib/utils.ts` for emails, credit card numbers, expiration dates, and CVV/CVC
- **Server-side** schema validation using **Zod**

### Responsive Design
- Mobile-first approach with Tailwind CSS breakpoints
- Grid layouts that adapt from 4 columns (desktop) down to 1 column (mobile)
- Responsive navigation and sidebar components

### Image Handling
- Product images served from the `/public/images` directory
- Remote images supported via Next.js image configuration (placeholder service)
- File upload support via `express-fileupload` on the backend

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Use TypeScript for all new frontend code
- Write meaningful commit messages
- Test your changes thoroughly before submitting a PR
- Update documentation if adding new features

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

**Copyright © 2025 Mohamed Timadjer**

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) — The React framework for production
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Prisma](https://www.prisma.io/) — Next-generation ORM
- [DaisyUI](https://daisyui.com/) — Tailwind CSS component library
- [NextAuth.js](https://next-auth.js.org/) — Authentication for Next.js
- [Zustand](https://zustand-demo.pmnd.rs/) — Bear-necessities state management

---

<p align="center">
  Made with ❤️ by <strong>Mohamed Timadjer</strong>
</p>
