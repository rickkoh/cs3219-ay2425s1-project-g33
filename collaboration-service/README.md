# Real-time Messaging Server

This is a simple server implementation using Socket.io for real-time messaging. The server listens for connections and emits messages to all connected clients.

## Project Overview

- The server is hosted on port **3000**.
- A Next.js frontend automatically runs on port **3001**.
- The server handles real-time connections, broadcasts messages, and manages disconnections.

## How to Run

1. **Clone the repository** and navigate to the project directory.

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the server**:

   ```bash
   npm run dev
   ```

4. The server will start on port 3000, and the Next.js frontend will automatically run on port 3001.

## Server Details

- **Socket.io Configuration**:

  - CORS is enabled for `http://localhost:3001`.
  - Accepts `GET` and `POST` methods.

- **Events**:
  - `connection`: Logs when a user connects.
  - `message`: Listens for messages from clients and broadcasts them to all connected users.
  - `disconnect`: Logs when a user disconnects.

## Demo

- Open your Next.js frontend on `http://localhost:3001`.
- Send a message, and it will be broadcasted to all connected users.
