# PWA Notification App

This project is a simple Progressive Web App (PWA) that demonstrates how to implement notifications using a service worker. The application allows users to receive notifications when a button is clicked.

## Project Structure

```
pwa-notification-app
├── package.json         # npm configuration file with dependencies and scripts
├── README.md            # Project documentation
├── server.js            # Node.js server to serve static files
├── public
│   ├── index.html       # Main HTML file containing the button
│   ├── main.js          # Main JavaScript file handling button click and notifications
│   ├── sw.js            # Service worker script for handling push notifications
│   ├── manifest.webmanifest # PWA manifest file with app settings
│   └── style.css        # Stylesheet for basic styling
└── tsconfig.json        # TypeScript configuration file
```

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd pwa-notification-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` (or the port specified in your server configuration).

5. **Interact with the app:**
   Click the button to receive a notification.

## Features

- Service Worker for handling notifications
- Simple UI with a button to trigger notifications
- PWA capabilities with a manifest file

## Notes

Make sure to allow notifications in your browser settings to receive alerts.