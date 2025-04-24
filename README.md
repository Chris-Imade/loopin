
# Social Video Chat App

A modern video chat application built with Next.js, Firebase, and Agora SDK that enables real-time video communication and social features.

## 🚀 Core Features

### Video Chat
- Real-time 1:1 video conversations
- Random matchmaking system
- Time-limited chat sessions
- Duo Mode support (2v2 chats)
- Quick skip and rematch functionality

### User Profiles
- Customizable user profiles with:
  - Profile pictures
  - Username
  - Gender and age
  - Optional bio and music preferences
- "Moments" feed for sharing short video clips
- Online status indicators

### Authentication & Security
- Firebase Authentication integration
- Multiple sign-in options:
  - Google Authentication
  - Email/Password
  - Apple Sign-in
- Secure user data management
- Content moderation system
- User reporting and blocking features

### Premium Features
#### Free Tier
- 30 swipes per day
- Basic profile customization
- 15-second video chat limit

#### Premium Tier ($5.99/month)
- Unlimited swipes
- Extended 60-second chat timer
- Duo Mode access
- View likes received
- Daily profile boost

#### Creator Tier ($12.99/month)
- Public streaming capability
- Pinned moments
- Custom profile themes
- Analytics dashboard

## 🛠️ Technical Stack

- **Frontend**: Next.js with TypeScript
- **UI Framework**: Chakra UI
- **Video SDK**: Agora.io
- **Backend Services**: Firebase
  - Authentication
  - Firestore Database
  - Cloud Functions
  - Storage
- **Payment Processing**: Stripe

## 🔒 Security Features
- Secure video transmission
- End-to-end encryption
- User data protection
- Content moderation
- Report/Block system

## 💻 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://0.0.0.0:3000`

## 🌐 Deployment

This project is configured for deployment on Replit. Use the Deployments feature to publish your changes.

## 🔑 Environment Variables

Required environment variables are documented in `.env.example`. Configure these in the Secrets tab on Replit.
