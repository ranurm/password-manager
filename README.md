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

1. You need to register to Atlassian MongoDB and there create your own cluster and press connect. Then configure it in the `.env` file. Replace `MONGODB_URI` with your own MongoDB connection string. In the spot <db_password> you need to replce with your password. 

Example 
"
MONGODB_URI="mongodb+srv://<db_password>:......"
"

2. Next you need connect your computer to the same network than your phone. Make sure you have downloaded the Expo app from your phones appstore.

3. Write "ipconfig" in your terminal and check your ip adress. Copy it to the mobilephone_2F_login_app/app/constants/config.ts file. 

Example
"
export const API_URL = 'http://192.168.3.20:3000/api';
"

4. Open the secure_credentials-app folder in your terminal and run 

Navigate to the web application directory:
   ```bash
   cd secure-credentials-app
   ```
Install dependencies:
   ```bash
   npm install
   ```
Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.


6. Mobile Application Setup

Navigate to the mobile application directory:
   ```bash
   cd mobilephone_2F_login_app
   ```
Install dependencies:
   ```bash
   npm install
   ```
Start the Expo development server:
   ```bash
   npx expo start
   ```

7. To run the application:
   - Scan the QR code with the Expo Go app on your device
   - The device needs to be connected to the same network and all the constants added to the required files.

Now the program is ready to use

## Authors

- Veeti Salminen
- Antti Santala
- Rami Nurmoranta
