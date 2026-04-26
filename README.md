# FixMate Mobile

Live production website for a Sydney phone repair business. Full-stack application with React frontend and Node.js backend, handling real customer bookings and quote requests via email.

**Live site:** [fixmatemobile.com](https://fixmatemobile.com)

## About

FixMate Mobile is a real business website serving active customers in Sydney. The site handles booking requests, quote submissions, and email notifications for a local phone repair shop. Built end-to-end and deployed to production with separate frontend and backend services.

## Tech Stack

**Frontend (fixmate_mobile/):**
- React
- Vite
- Tailwind CSS
- Deployed on Vercel

**Backend (fixmate_backend/):**
- Node.js + Express
- Prisma (database ORM)
- PostgreSQL
- Resend (transactional email service)
- Deployed on Render

## Features

- Customer booking flow with form validation
- Quote request system with email notifications to business owner
- Mobile-responsive design optimized for phone users
- Real-time email delivery via Resend API
- Database-backed submission tracking

## What Makes This Different

This isn't a portfolio demo or a practice project. It's a live production system serving a real Sydney business with real customers making real bookings. The backend processes actual quote requests and sends emails that result in real repair jobs.

Built solo, deployed independently to two separate services (Vercel for frontend, Render for backend), and currently in active use.
