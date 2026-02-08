# 🌐 Gateway Server Setup Guide

## What This Does

The Gateway Server is your x402 HTTP endpoint that:
- Returns **402 Payment Required** when accessed without payment
- Verifies payments on Plasma blockchain
- Returns premium content after payment confirmed

---

## 📁 Setup Instructions

### Step 1: Create Gateway Folder

```bash
mkdir plasma-gateway
cd plasma-gateway
```

### Step 2: Download Files

Download these files and place them in the `plasma-gateway` folder:
1. **gateway-server.js** → rename to `server.js`
2. **gateway-package.json** → rename to `package.json`
3. **gateway-env.example** → rename to `.env`

Your folder should look like:
```
plasma-gateway/
├── server.js
├── package.json
└── .env
```

### Step 3: Configure .env

Edit `.env` and add your contract address (from Remix deployment):

```
CONTRACT_ADDRESS=0xYourActualContractAddress
PLASMA_RPC_URL=https://testnet-rpc.plasma.to
PORT=3000
```

### Step 4: Install Dependencies

```bash
npm install
```

This installs:
- Express (web server)
- Ethers.js (blockchain connection)
- Dotenv (environment variables)

### Step 5: Start the Server

```bash
npm start
```

**Expected Output:**
```
🚀 Plasma x402 Gateway Server Started!
===========================================
📍 Server running on: http://localhost:3000
📝 Contract Address: 0x1234...
🌐 Network: Plasma Testnet
💰 Price: 0.01 XPL per request
===========================================

📖 Visit http://localhost:3000 for API documentation
🏥 Health check: http://localhost:3000/health
🔐 Premium endpoint: http://localhost:3000/api/premium-data
```

---

## ✅ Test Your Gateway

### Test 1: Health Check

Open browser or use curl:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "healthy",
  "contract": "0x1234...",
  "network": "Plasma Testnet",
  "price": "0.01 XPL",
  "currentBlock": 12345
}
```

### Test 2: Get 402 Response

```bash
curl http://localhost:3000/api/premium-data
```

Should return **402** with payment instructions:
```json
{
  "error": "Payment Required",
  "requestId": "0xabc123...",
  "payment": {
    "amount": "0.01",
    "currency": "XPL",
    "contractAddress": "0x1234..."
  }
}
```

---

## 🎯 How It Works

```
1. Client requests → GET /api/premium-data
2. Server responds → 402 Payment Required (with requestId)
3. Client pays → Calls contract.pay(requestId) on Plasma
4. Client retries → GET /api/premium-data with X-PAYMENT header
5. Server verifies → Checks blockchain for payment
6. Server returns → 200 OK with premium content
```

---

## 📝 API Endpoints

### **GET /**
- Info page with API documentation
- Shows how to use the gateway

### **GET /health**
- Health check endpoint
- Returns contract status and network info

### **GET /api/premium-data**
- Premium content endpoint (requires payment)
- Returns 402 if no payment
- Returns 200 with content if paid

---

## 🔧 Troubleshooting

**Error: "Cannot find module 'express'"**
→ Run `npm install`

**Error: "Invalid contract address"**
→ Check `.env` has correct CONTRACT_ADDRESS from Remix

**Error: "Network connection failed"**
→ Check internet connection and Plasma RPC

**Server starts but /health fails**
→ Verify contract address is correct
→ Check Plasma testnet is accessible

---

## ✨ Success!

Your gateway is now running! 

**Next Step:** Build the AI Agent that will:
1. Discover your gateway
2. Make payment on Plasma
3. Access premium content

Ready to build the agent? 🤖

---

## 💡 Keep Server Running

To keep server running in background:

**Option 1: Use screen (Linux/Mac)**
```bash
screen -S gateway
npm start
# Press Ctrl+A then D to detach
```

**Option 2: Use PM2**
```bash
npm install -g pm2
pm2 start server.js --name "plasma-gateway"
pm2 logs
```

**Option 3: Just for testing**
Keep terminal window open with `npm start` running
