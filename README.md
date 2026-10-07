# Guardian Pulse

A behavioral heuristics safety app that learns daily rhythms and alerts next of kin during abnormal inactivity. Built with React, Vite, Tailwind CSS, TypeScript, and Capacitor for Android.

## Features

- **Behavioral Heuristics & Learning**: Learns normal daily activity rhythms and routines.
- **Inactivity Detection**: Detects abnormal periods of inactivity and triggers safety alarms/check-ins.
- **Emergency Alerts (NOK)**: Automatically notifies Next of Kin contacts during emergencies.
- **Sensor Dashboard**: Real-time monitoring of device sensors, motion, battery, and screen state.
- **Capacitor Android Integration**: Fully native Android support with local notifications, motion tracking, and status bar control.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Android Studio (for Android build and deployment)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and set your configuration values:
   ```bash
   cp .env.example .env
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```

## Android Development

To build and run the app on Android using Capacitor:

1. **Sync Capacitor & Build Web Assets:**
   ```bash
   npm run android:sync
   ```

2. **Open in Android Studio:**
   ```bash
   npm run android:open
   ```

3. **Build Debug APK:**
   ```bash
   npm run android:build
   ```
