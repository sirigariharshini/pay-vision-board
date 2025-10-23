# 💳 Rapid Payments  
### (An IoT-Based Contactless Smart Payment System)  

---

## 🧾 Abstract  
*Rapid Payments* is an IoT-based contactless payment system designed to simplify and accelerate small-scale transactions in college environments such as canteens, libraries, and stationery shops.  

Students can make instant payments by tapping their NFC-enabled ID cards — no cash, no mobile apps needed!  

The system integrates *ESP32, **Supabase, and a **Flask-based web dashboard* for real-time synchronization and secure payment tracking.  

---

## 🚀 Features  
- 🔐 *NFC Authentication:* Tap-to-pay using student ID cards.  
- ⚡ *Instant Payments:* Real-time balance validation and transaction confirmation.  
- 🖥 *Web Dashboard:* Admin can manage users, recharge balances, and view logs.  
- ☁ *Cloud-Connected:* Real-time sync with Supabase.  
- 💡 *Visual Feedback:* LED and TFT display indicate transaction status.  
- 🔊 *Audio Alerts:* Buzzer feedback for every transaction.  

---

## 🧰 Project Requirements  

### *Hardware*
| Component | Description |
|------------|-------------|
| ESP32 / ESP8266 | Microcontroller for processing and Wi-Fi |
| RC522 RFID Reader | Reads NFC tags or cards |
| RFID / NFC Tags | Assigned to students |
| 2-inch TFT Touch Display | Displays payment info and messages |
| Buzzer | Audio feedback for success/failure |
| LED | Status indicator |

---

### *Software*
#### *ESP32 / IoT*
- Arduino IDE  
- ESP32 Board Package  
- MFRC522 Library  
- Adafruit Fingerprint Library (R307/AS608)  
- WiFi.h, HTTPClient.h  
- ArduinoJson (optional)  

#### *Backend / Database (Supabase)*
- Supabase Account  
- PostgreSQL Database  
- Supabase Auth (role-based login)  
- Supabase API Key  
- Row Level Security (RLS)  
- RPC Function: deduct_balance  

#### *Web Dashboard*
- Node.js v18+  
- React.js + Tailwind CSS  
- Supabase JS SDK  
- Vite or Create React App  
- React Router / React Query  
- Chart.js / Recharts (optional)  

#### *Additional Tools*
- Postman or Insomnia  
- Visual Studio Code  
- Git / GitHub  
- MQTT Broker (optional)  

---

## 🧩 Proposed Model  

The system allows students to make instant payments by tapping their NFC-enabled ID cards.  
- The *ESP32* reads card data and verifies it with *Supabase*.  
- If the balance is sufficient, payment is processed and deducted automatically.  
- *LED/TFT* displays payment status in real-time.  
- *Admin Dashboard* provides full transaction visibility.  

This ensures a *cashless, **secure, and **real-time* transaction environment across campus.

---

## 🧠 Module Description  

### 1️⃣ NFC Card Authentication Module  
- Each student is assigned an NFC-enabled ID card.  
- ESP32 verifies the unique card ID securely.  

### 2️⃣ Payment Processing Module  
- Checks user balance from Supabase.  
- Deducts amount automatically upon successful validation.  

### 3️⃣ Display and Feedback Module  
- Shows “Payment Successful”, “Insufficient Balance”, or “Card Error” on LED.  

### 4️⃣ Web Dashboard (Admin Module)  
- Built with React.js + Supabase.  
- Allows recharges, user management, and transaction logs.  

### 5️⃣ Database Module  
- Real-time updates with *Supabase PostgreSQL* + *Realtime API*.  

---

## ⚙ Implementation Overview  

The *ESP32* microcontroller acts as the central controller:  
- Reads NFC input via RC522 module.  
- Communicates with *Supabase* backend using HTTPS.  
- Updates user balance and transaction history instantly.  
- Displays transaction status on TFT display and LED.  

The *React-based dashboard* allows admins to monitor, recharge, and control the entire system in real-time.  

---

## 🧱 Technology Stack  

| Layer | Technology / Tools | Purpose |
|-------|---------------------|----------|
| Microcontroller | ESP32 | Io
