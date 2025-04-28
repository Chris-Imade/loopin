# Loopin - Video Chat App

Loopin is a video chat application that connects users from around the world through random video calls.

## Tech Stack

- **Frontend**: Next.js, Chakra UI, Framer Motion
- **Authentication**: Firebase Authentication
- **Database**: MongoDB
- **Media Storage**: Cloudinary
- **Real-time Features**: Socket.io
- **Video Chat**: Agora RTC

## Architecture Overview

The application uses a hybrid approach:

- **Firebase Auth** for authentication
- **MongoDB** for data storage (user profiles, messages, etc.)
- **Socket.io** for real-time presence and messaging
- **Cloudinary** for media storage
- **Agora RTC** for video chat functionality

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- MongoDB Atlas account
- Cloudinary account
- Agora account (for video chat)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/loopin.git
cd loopin
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your credentials.

4. Firebase Auth Setup

- Create a Firebase project
- Enable Email/Password authentication
- Get your Firebase config (API Key, Auth Domain, etc.)
- Set up Firebase Admin SDK for server-side auth verification
  - Generate a private key in the Firebase console (Project settings > Service accounts)

5. MongoDB Setup

- Create a MongoDB Atlas cluster
- Create a database named `loopin` (or your preferred name)
- Update the MongoDB connection string in `.env.local`

6. Cloudinary Setup

- Create a Cloudinary account
- Get your Cloud name, API Key and API Secret
- Add them to `.env.local`

7. Socket.io Setup

- The Socket.io server is integrated with the Next.js API routes
- No additional setup required, but ensure the socket URL in `.env.local` is correct

8. Agora Setup

- Create an Agora account and project
- Get your App ID and add it to `.env.local`

### Running the App

```bash
# Development
npm run dev
# or
yarn dev

# Production build
npm run build
npm start
# or
yarn build
yarn start
```

## MongoDB Data Model

The application uses the following MongoDB collections:

1. **users**

   - User profiles, preferences, and subscription details
   - Linked to Firebase Auth via UID

2. **conversations**

   - Chat conversation metadata
   - Participants, last message, unread counts

3. **messages**
   - Individual messages within conversations
   - Text content, media attachments, read status

## Real-time Features

The application uses Socket.io for real-time features:

1. **User Presence**

   - Online/offline status
   - Last seen timestamps

2. **Messaging**

   - Real-time message delivery
   - Typing indicators
   - Read receipts

3. **Notifications**
   - New message notifications
   - Contact requests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

This project is configured for deployment on Replit. Use the Deployments feature to publish your changes.

## 🔑 Environment Variables

Required environment variables are documented in `.env.example`. Configure these in the Secrets tab on Replit.
