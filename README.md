# GalaxyCo.ai - AI-Native Business Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

An intelligent business automation platform combining AI agents, CRM, workflow automation, and knowledge management.

## Overview

GalaxyCo.ai is a comprehensive business platform that leverages AI to automate operations, manage customer relationships, and streamline workflows. Built for teams who want enterprise-grade features with modern developer experience.

## Features

- 🤖 **AI Agents** - Autonomous agents for sales, marketing, support, and operations
- 👥 **CRM** - Complete customer relationship management with pipeline tracking
- 📅 **Calendar Integration** - Google Calendar and Microsoft Outlook sync
- 📞 **Communications** - SMS, voice, and messaging workflows via SignalWire
- 📚 **Knowledge Base** - RAG-powered document search and management
- 🎯 **Marketing Automation** - Campaign management, analytics, and optimization
- 💰 **Finance Integration** - QuickBooks, Stripe, and Shopify connectors
- 📊 **Analytics** - Real-time business intelligence and reporting
- 🎨 **Content Studio** - AI-assisted blog post and document creation

## Tech Stack

### Core
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle
- **Auth**: Clerk

### Frontend
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **Icons**: Lucide
- **Forms**: React Hook Form + Zod

### AI & ML
- **LLM**: OpenAI GPT-4, Anthropic Claude
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector DB**: Upstash Vector
- **Search**: Perplexity AI

### Infrastructure
- **Hosting**: Vercel
- **Storage**: Vercel Blob
- **Background Jobs**: Trigger.dev
- **Real-time**: Pusher
- **Monitoring**: Sentry

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- API keys for required services (see `.env.example`)

### Installation

```bash
# Clone the repository
git clone https://github.com/galaxy-co-ai/galaxyco_ai_3.0.git
cd galaxyco_ai_3.0

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

### Environment Variables

Key environment variables required:

- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Clerk authentication
- `OPENAI_API_KEY` - OpenAI API access
- `UPSTASH_REDIS_REST_URL` - Redis cache
- `UPSTASH_VECTOR_REST_URL` - Vector database

See `.env.example` for complete list.

## Development

```bash
# Start dev server
npm run dev

# Open database GUI
npm run db:studio

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm test
```

## Deployment

This application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

For production deployment checklist, see internal documentation.

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   ├── db/               # Database schema
│   └── trigger/          # Background jobs
├── public/               # Static assets
└── drizzle/             # Database migrations
```

## Contributing

This is a private repository. For contribution guidelines, contact the maintainers.

## License

This project is proprietary software. All rights reserved.

## Support

For questions or issues, contact: [hello@galaxyco.ai](mailto:hello@galaxyco.ai)

---

**Built with ❤️ by the GalaxyCo.ai team**
