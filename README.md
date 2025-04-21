# Secure Password Manager

A comprehensive password management system built for the Secure Programming university course. This project consists of a Next.js web application and a React Native mobile application, designed to demonstrate secure credential storage and authentication practices.

## Project Overview

This password manager implements multiple layers of security including:
- End-to-end encryption for stored credentials
- Two-factor authentication
- Secure API communications
- OWASP best practices for web and mobile security

## Repository Structure

- `/secure-credentials-app`: Next.js web application for password management
- `/mobilephone_2F_login_app`: React Native mobile application for authentication and credential access

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Mobile**: React Native, Expo
- **Security**: JWT authentication, encryption libraries, secure storage

## Getting Started

### Web Application Setup (Next.js)

1. Navigate to the web application directory:
   ```bash
   cd secure-credentials-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Mobile Application Setup (React Native)

1. Navigate to the mobile application directory:
   ```bash
   cd mobilephone_2F_login_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

4. To run the application:
   - Scan the QR code with the Expo Go app on your device
   - The device needs to be connected to the same network



## Authors

- Veeti Salminen
- Antti Santala
- Rami Nurmoranta
