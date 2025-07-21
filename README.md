# 💸 Finance Tracker

A full-stack personal finance tracker built with **Next.js 14 (App Router)**, **MongoDB**, and **Tailwind CSS**, designed to help users monitor expenses, manage budgets, and gain insight through real-time analytics.


---

## 🚀 Features

- ✅ User authentication (sign in / sign up)
- ✅ Add, edit, and delete transactions
- ✅ Categorize spending with dynamic budgets
- ✅ Real-time analytics and spending visualizations
- ✅ Fully responsive and modern UI

---

## 🛠️ Tech Stack

**Frontend**
- Next.js 14 (App Router)
- Tailwind CSS
- React Hooks
- Framer Motion (for animations)

**Backend**
- MongoDB (via Mongoose)
- RESTful API routes with App Router
- JWT-based Authentication

**Deployment**
- Hosted on [Vercel](https://vercel.com)

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root and add the following:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
