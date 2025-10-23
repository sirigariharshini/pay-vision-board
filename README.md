# 💳 Rapid Payments
### *(An IoT-Based Contactless Smart Payment System)*

---

![Rapid Payments Banner](assets/banner.png) <!-- Replace with actual image path -->

## 📖 Abstract

**Rapid Payments** is an **IoT-based contactless payment system** designed to simplify and accelerate small-scale transactions in college environments such as canteens, libraries, and stationery shops.

Students make instant payments by tapping their **NFC-enabled ID cards**, eliminating the need for cash or mobile apps.  
The system uses an **ESP32 Wi-Fi module** for real-time communication with a **Flask-based web dashboard**, while **Firebase Realtime Database** ensures immediate synchronization of payment data.

The admin can securely manage user accounts, track transaction logs, and recharge balances through the dashboard.  
An **LED matrix display** provides instant visual feedback on payment status.

By integrating **IoT**, **cloud**, and **web technologies**, this low-cost and portable solution delivers a **fast, secure, and smart payment experience**—ideal for educational institutions and other micro-transaction settings.

---

## 🧠 Introduction

In today’s era of digital transformation, the need for **fast and secure payment systems** has become increasingly important, especially in educational institutions.  
Traditional cash-based transactions in college canteens and stores often lead to **delays and manual errors**.

**Rapid Payments** introduces an IoT-based contactless payment system that enables students to make instant payments using their **NFC-enabled ID cards**.  

The system:
- Uses an **ESP32 module** for wireless communication.
- Provides a **Flask-based web dashboard** for admin monitoring.
- Relies on **Firebase Realtime Database** for real-time synchronization.

Each student’s ID card is linked to their account, and an **LED matrix** provides instant feedback on payment status.  
This **low-cost, efficient solution** promotes a seamless, cashless campus environment.

---

## ⚙️ Project Requirements

### 🧩 Hardware Requirements
| Component | Description |
|------------|-------------|
| **ESP32 / ESP8266** | Microcontroller for data processing & Wi-Fi |
| **RC522 RFID Reader Module** | Reads unique ID from RFID/NFC cards |
| **RFID/NFC Tags (2–3)** | Assigned to each student for identification |

---

### 💻 Software Requirements

#### Firmware (ESP32 / IoT)
- Arduino IDE (latest)
- ESP32 Board Package
- **Libraries:** MFRC522, WiFi.h, HTTPClient.h, ArduinoJson (optional)
- Adafruit Fingerprint Library (R307/AS608)

#### Backend / Database (Supabase)
- Supabase Account (Free or Paid)
- PostgreSQL Database (hosted on Supabase)
- Supabase Auth (role-based login)
- Supabase API Key (REST access)
- Row Level Security (RLS)
- RPC Function: `deduct_balance`

#### Web Dashboard
- Node.js v18+
- React (latest)
- Tailwind CSS
- Supabase JS SDK
- Vite / Create React App
- React Router
- React Query / SWR *(optional)*
- Chart.js / Recharts *(optional)*

#### Additional Tools
- Postman / Insomnia (API testing)
- Visual Studio Code (IDE)
- Git / GitHub (version control)
- MQTT Broker *(optional)*

#### System Requirements
- OS: Windows 10+, macOS 10.15+, Linux
- RAM: 8 GB (recommended)
- Storage: 20 GB free
- Internet: Required for Supabase & Dashboard

---

## 🧩 Proposed Model

The **proposed model** of Rapid Payments enables a **smart and secure contactless payment system** for college campuses using IoT and cloud technologies.

Workflow:
1. Student taps their NFC-enabled ID card.
2. **RC522 module** reads the card’s unique ID.
3. **ESP32** verifies the ID from Firebase Realtime Database.
4. Upon valid balance:
   - Amount is deducted.
   - LED display shows payment success.
5. Admin dashboard (Flask-based) allows:
   - Balance updates
   - Transaction monitoring
   - Account management

This model:
- Eliminates the need for cash or mobile wallets.
- Enhances transparency.
- Reduces human error.
- Ensures **real-time synchronization**.

---

## 🧮 Module Description

### 1️⃣ NFC Card Authentication Module
- Each student is issued an NFC-enabled ID card.
- When tapped, the **NFC reader** captures the unique ID.
- The ID is sent to ESP32 for verification.
- Ensures **secure and quick** user identification.

### 2️⃣ Payment Processing Module
- ESP32 retrieves balance from Firebase.
- If sufficient, the transaction is approved and deducted automatically.
- Updates instantly reflected in database for real-time tracking.

### 3️⃣ Display and Feedback Module
- **LED matrix** displays:
  - “Payment Successful”
  - “Insufficient Balance”
  - “Card Error”
- Provides real-time feedback for users.

### 4️⃣ Web Dashboard (Admin Module)
- Built using **Flask**.
- Admin can:
  - Manage users
  - Recharge balances
  - View transaction logs
- Secure login restricts access to authorized personnel.

### 5️⃣ Database Module
- **Firebase Realtime Database** stores:
  - User profiles
  - Card IDs
  - Balances
  - Transaction logs
- Enables **real-time updates** between hardware and cloud.

---

## 🧠 Implementation

The system integrates **hardware and software** to ensure secure, real-time payment processing.

Process:
1. **ESP32** interfaces with **RFID module** for card authentication.
2. Communicates with **Flask web server** via Wi-Fi.
3. **Firebase Realtime Database** manages:
   - User credentials
   - Account balances
   - Transaction records
4. On successful verification:
   - Balance deducted
   - LED display updated instantly

Ensures:
- **Real-time synchronization**
- **Data integrity**
- **User convenience**
- Promotes a **cashless transaction environment**.

---

## 🧰 Technology Stack

| Layer | Technology / Tools Used | Purpose |
|-------|--------------------------|----------|
| **Microcontroller** | ESP32 | Core IoT controller (Wi-Fi + processing) |
| **Sensors** | RC522 RFID Reader, R307 / AS608 Fingerprint Sensor | User authentication |
| **Display & Output** | ILI9341 TFT Display, Buzzer | Visual and sound feedback |
| **Firmware** | Arduino (C/C++) | IoT firmware development |
| **Communication** | HTTPS (REST API) | ESP32 ↔ Supabase data exchange |
| **Backend Platform** | Supabase | Cloud database + authentication |
| **Database** | PostgreSQL (Supabase) | Store users & transactions |
| **Auth System** | Supabase Auth | Role-based login management |
| **Server Logic** | Supabase RPC (PostgreSQL Function) | Balance deduction logic |
| **Realtime Updates** | Supabase Realtime | Live transaction updates |
| **Frontend Framework** | React.js | Web dashboard UI |
| **Styling** | Tailwind CSS | Responsive design |
| **Frontend SDK** | Supabase JS SDK | Connect React ↔ Supabase |
| **Hosting** | Vercel / Supabase Hosting | Web dashboard deployment |
| **Version Control** | GitHub | Source code management |

---

## 🧩 System Architecture

![System Diagram](assets/system-architecture.png)  
*Replace with your architecture diagram.*

---

## 🧱 Block Diagram

![Block Diagram](assets/block-diagram.png)

---

## ⚙️ Hardware Connections

| Component | Connection to ESP32 |
|------------|----------------------|
| RC522 RFID Reader | SPI Pins (SCK, MOSI, MISO, SDA, RST) |
| Fingerprint Sensor | TX/RX Pins |
| TFT Display | SPI Interface |
| LED / Buzzer | GPIO Pins |

---

## 🧑‍💻 Implementation Workflow

![Implementation Flow](assets/implementation-flow.png)

---

## 📊 Results & Output

- **Successful payment:** “Payment Successful” shown on LED/TFT  
- **Insufficient balance:** Red LED + warning message  
- **Database update:** Supabase reflects transaction in real-time  
- **Admin dashboard:** Displays logs and user balances  

---

## 🧩 Conclusion

The **Smart Payment System** integrates **IoT** and **cloud technologies** to deliver a **secure, fast, and efficient contactless payment solution** for campuses.

- **ESP32 + RFID + Fingerprint sensor** ensures authenticated transactions.
- **Supabase (PostgreSQL + Auth)** handles backend and logic via RPC.
- **React.js Dashboard** allows admins and students to monitor transactions.
- **Realtime updates** maintain system transparency and data consistency.

✅ Delivers a **cashless, reliable, and scalable** payment solution.

---

## 👩‍💻 Team Members

| Name | Roll No | Role |
|------|----------|------|
| **C. Laksmikar** | 24241A0428 | Hardware & Integration |
| **S. Harshini** | 24241A66AK | Firmware & Supabase Backend |
| **M. Ashmitha** | 24241A05PD | Web Dashboard Development |
| **I. Pravalika** | 24241A3218 | Database & Testing |
| **Rohith** | 24241A66CF | UI/UX & Deployment |

**Guided by:**  
🎓 *M. Pranav Satya Venkat Sai*

---

## 📂 Repository Structure

