# Quick Setup Guide

Get your Plasma x402 Gateway running in 5 minutes!

## 📋 Prerequisites

- ✅ Node.js v18+
- ✅ MetaMask installed
- ✅ USDT on Plasma Testnet

## ⚡ 5-Minute Setup

### 1️⃣ Clone & Install (1 min)

```bash
git clone https://github.com/yourusername/plasma-x402-gateway
cd plasma-x402-gateway
npm install
```

### 2️⃣ Configure (2 min)

Create `.env`:

```bash
CONTRACT_ADDRESS=0x84a4622a713f965890a95dc2d022c32e31c4aec9
USDT_ADDRESS=0x502012b361aebce43b26ec812b74d9a51db4d412
PLASMA_RPC_URL=https://testnet-rpc.plasma.to
PORT=3000
AGENT_PRIVATE_KEY=your_private_key_here
```

### 3️⃣ Run (1 min)

```bash
# Start gateway
npm run gateway

# Visit http://localhost:3000
```

### 4️⃣ Test AI Agent (1 min)

In new terminal:

```bash
npm run agent
```

## ✅ Done!

You should see:
- ✅ Gateway running on port 3000
- ✅ Frontend accessible in browser
- ✅ AI agent making autonomous payments

---

## 🚨 Quick Troubleshooting

**Port already in use?**
```bash
# Change PORT in .env
PORT=3001
```

**No USDT?**
```bash
# Use MockUSDT faucet function or get from testnet
# Your MockUSDT contract likely has a faucet() function
```

**Connection errors?**
```bash
# Check Plasma RPC is accessible
curl https://testnet-rpc.plasma.to
```

---

## 🚀 Next Steps

1. **Deploy to Railway** - See [Deployment Guide](#deployment)
2. **Customize pricing** - Call `updatePrice()` on contract
3. **Record demo video** - Show human + AI agent flows
4. **Submit to hackathon!** 🏆

---

For full documentation, see [DOCUMENTATION.md](DOCUMENTATION.md)
