# AI Finance Platform

A full-stack financial platform built with Next.js, Tailwind CSS, Prisma, Clerk, and more. This application provides financial analytics, reporting, and AI-powered insights.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Shadcn UI
- **Authentication**: Clerk
- **Database**: Prisma ORM
- **Email**: Resend, React Email
- **AI**: Google Gemini API
- **Security**: ArcJet
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Git
- A database (PostgreSQL recommended)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd aifinance
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=your_database_connection_string
DIRECT_URL=your_direct_database_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up


# AI
GEMINI_API_KEY=your_gemini_api_key

# Email
RESEND_API_KEY=your_resend_api_key

# Security
ARCJET_KEY=your_arcjet_key
```

### 4. Database Setup

Set up your database and run the Prisma migrations:

```bash
npx prisma generate
npx prisma db push
```

### 5. Start the development server

```bash
npm run dev
```

The application will be available at http://localhost:3000

### 6. Email Development (Optional)

To preview emails during development:

```bash
npm run email
```

## Building for Production

```bash
npm run build
npm run start
```

## Project Structure

- `/app` - Next.js application routes and pages
- `/components` - Reusable UI components
- `/actions` - Server actions
- `/lib` - Utility functions and configurations
- `/prisma` - Database schema and migrations
- `/emails` - Email templates
- `/public` - Static assets

## Features

- User authentication with Clerk
- Financial dashboard and analytics
- AI-powered receipts scanning
- Monthly Budget Alerts
- Financial monthly report insights using AI
- Automatic Recurring Transaction
- Responsive design
- Rate limiting on create transaction
