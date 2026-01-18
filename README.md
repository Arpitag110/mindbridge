# MindBridge – A Mental Health & Community Support Platform

MindBridge is a full-stack web application designed to support mental well-being through **mood tracking, journaling, community circles, and real-time interaction**.  
It provides users with a safe digital space to reflect, connect, and grow emotionally.

This project was developed as part of a **IMG winter assignment** to demonstrate full-stack development, real-time systems, and thoughtful user-centric design.

---

## Video Demo

https://drive.google.com/file/d/141eN-N9aaHaCs4Ekdw0RmaTHB_ZREwAb/view?usp=drivesdk

---

## Key Features

### Authentication & User Management
- Secure user registration and login
- Persistent sessions using local storage
- Profile customization (avatar, bio, interests)

---

### Mood Tracking
- Daily mood check-ins with emoji-based scale
- Tag-based emotional factors (Work, Health, Sleep, etc.)
- Optional notes for reflection
- Smart motivational messages after check-ins
- Mood history and weekly visualization
- Visibility control:
  - **Private** – visible only to the user  
  - **Circles** – visible to shared community circles  
  - **Public** – visible to all users

---

### Journaling
- Create and manage journal entries
- Rich text long-form writing experience
- Entry history with timestamps
- Visibility options:
  - Private
  - Circles
  - Public
- Clean distraction-free UI for writing

---

### Community Circles
- Discover and join interest-based support circles
- Public and private circles
- Join request system for private circles
- Anonymous posting option
- Community feed with:
  - Posts
  - Likes
  - Comments
  - Reporting system
- Built-in **Q&A support section**
- Admin controls:
  - Approve/reject join requests
  - Remove members
  - Manage reported content
  - Edit circle details

---

### Dashboard
- Centralized overview of user activity
- Mood trend visualization (graphs)
- Joined circles summary
- Real-time notifications (likes, comments, posts)
- Integrated **real-time private chat system**

---

### Real-Time Chat
- One-to-one private messaging
- Real-time delivery using **Socket.IO**
- Recent conversations list
- Persistent message history

---

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios
- React Router
- Recharts
- Socket.IO Client

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO
- MVC architecture

### Database
- MongoDB Atlas

### Prerequisites
- Node.js
- MongoDB (local or Atlas)

### Backend Setup
cd server

npm install

npm run dev

Create .env file

MONGO_URI=your_mongodb_connection_string

### Frontend Setup
cd client

npm install

npm run dev

## Limitations (Current)

- No email verification
- No AI-based mental health analysis
- No mobile app (web-only)

## Future Enhancements

- AI-based mood insights
- Therapist / mentor role support
- Mobile application
- Advanced analytics dashboard
- End-to-end encrypted chats