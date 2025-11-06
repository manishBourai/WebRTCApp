# webRtc

A simple WebRTC video call application using React, Vite, Socket.IO, and Node.js.

## Features

- Real-time peer-to-peer video calls using WebRTC
- User list and signaling via Socket.IO
- Responsive React frontend with Tailwind CSS
- Express/Node.js backend for signaling
- Cut Button to end calls with confirmation dialog

## Getting Started

### Installation

You can run this application using either Docker or manual installation.

#### Using Docker
```bash
# Clone the repository
git clone https://github.com/yourusername/webrtc.git
cd webrtc

# Start the application using Docker
docker-compose up --build

# Access the application at http://localhost:5173
```

To stop the application:
```bash
docker-compose down
```

#### Manual Setup

##### Backend
```bash
cd backend
npm install
npm run dev
```

##### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Usage

1. Start the backend server (`npm run dev` in `backend`).
2. Start the frontend (`npm run dev` in `frontend`).
3. Open the frontend in your browser (usually at [http://localhost:5173](http://localhost:5173)).
4. Open another browser window or device to connect and test video calls.

### New Features & Updates

- **Cut Button**: Added to the call UI for ending calls.
- **Call Confirmation**: When someone calls you, a confirmation dialog appears. You must accept the call before the connection is established.
- **Improved ICE Candidate Handling**: Both peers now listen for ICE candidates as soon as the socket connects, ensuring reliable connection setup.
- **Responsive Sidebar**: Sidebar is now mobile-friendly and toggles with a hamburger button.
- **Remote Video Stream**: Remote video is displayed correctly when a call is active.

## Project Structure

```
webRtc/
├── backend/         # Express + Socket.IO signaling server
│   └── src/
│       └── index.ts
├── frontend/        # React + Vite + Tailwind CSS client
│   └── src/
│       └── components/
│           └── CallBox.tsx
│           └── Sidebar.tsx
│       └── main.tsx
│   └── vite.config.ts
│   └── README.md
└── .gitignore
```

## License

MIT