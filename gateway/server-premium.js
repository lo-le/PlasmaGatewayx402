const express = require('express');
const { ethers } = require('ethers');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('frontend')); // Serve frontend files

// Configuration
const PORT = 3000;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PLASMA_RPC = process.env.PLASMA_RPC_URL || 'https://testnet-rpc.plasma.to';
const PRICE_XPL = '0.01'; // Price in XPL

// Contract ABI
const CONTRACT_ABI = [
  "function hasPaid(bytes32 requestId) view returns (bool)",
  "function getPayment(bytes32 requestId) view returns (tuple(address payer, uint256 amount, uint256 timestamp, bool exists))",
  "function price() view returns (uint256)"
];

// Connect to Plasma
const provider = new ethers.JsonRpcProvider(PLASMA_RPC);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// In-memory storage
const requestCache = new Map();

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

/**
 * Generate mock premium data
 */
function generatePremiumData() {
  return {
    cryptoPrices: {
      BTC: {
        price: (Math.random() * 10000 + 40000).toFixed(2),
        change24h: (Math.random() * 10 - 5).toFixed(2) + '%',
        volume24h: '$' + (Math.random() * 10 + 20).toFixed(2) + 'B'
      },
      ETH: {
        price: (Math.random() * 500 + 2000).toFixed(2),
        change24h: (Math.random() * 10 - 5).toFixed(2) + '%',
        volume24h: '$' + (Math.random() * 5 + 8).toFixed(2) + 'B'
      },
      XPL: {
        price: (Math.random() * 0.5 + 0.5).toFixed(4),
        change24h: (Math.random() * 20 - 10).toFixed(2) + '%',
        volume24h: '$' + (Math.random() * 2 + 1).toFixed(2) + 'M'
      }
    },
    marketData: {
      totalMarketCap: '$' + (Math.random() * 500 + 1500).toFixed(2) + 'B',
      bitcoinDominance: (Math.random() * 10 + 45).toFixed(2) + '%',
      defiTVL: '$' + (Math.random() * 50 + 80).toFixed(2) + 'B'
    },
    timestamp: new Date().toISOString(),
    dataProvider: 'Premium Crypto Data API',
    refreshRate: '1 minute'
  };
}

/**
 * Main x402 endpoint - Premium Data Access
 */
app.get('/api/premium-data', async (req, res) => {
  try {
    console.log('\n🔔 Incoming request to /api/premium-data');
    
    const paymentHeader = req.headers['x-payment'];
    
    if (!paymentHeader) {
      // No payment - return 402
      const requestId = generateRequestId();
      
      console.log('❌ No payment provided');
      console.log('📝 Generated request ID:', requestId);
      
      requestCache.set(requestId, {
        created: Date.now(),
        status: 'pending'
      });
      
      return res.status(402).json({
        error: 'Payment Required',
        requestId: requestId,
        payment: {
          amount: PRICE_XPL,
          currency: 'XPL',
          network: 'plasma-testnet',
          chainId: 9746,
          contractAddress: CONTRACT_ADDRESS,
          rpcUrl: PLASMA_RPC,
          explorerUrl: 'https://testnet.plasmascan.to'
        },
        instructions: {
          step1: 'Call contract.pay(requestId) with value >= ' + PRICE_XPL + ' XPL',
          step2: 'Include transaction hash in X-PAYMENT header',
          step3: 'Retry this request with X-PAYMENT header'
        },
        message: 'Pay ' + PRICE_XPL + ' XPL to access premium crypto market data'
      });
    }
    
    // Payment header provided
    console.log('💳 Payment header received');
    
    let paymentData;
    try {
      paymentData = JSON.parse(paymentHeader);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid payment header format' });
    }
    
    const { requestId } = paymentData;
    
    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId in payment' });
    }
    
    console.log('🔍 Verifying payment for request:', requestId);
    
    // Verify payment on blockchain
    const hasPaid = await contract.hasPaid(requestId);
    
    if (!hasPaid) {
      console.log('❌ Payment not found on blockchain');
      return res.status(402).json({
        error: 'Payment not verified',
        message: 'No payment found for this request ID. Please ensure transaction is confirmed.',
        requestId: requestId
      });
    }
    
    // Get payment details
    const payment = await contract.getPayment(requestId);
    console.log('✅ Payment verified!');
    console.log('   Payer:', payment.payer);
    console.log('   Amount:', ethers.formatEther(payment.amount), 'XPL');
    console.log('   Timestamp:', new Date(Number(payment.timestamp) * 1000).toISOString());
    
    // Generate and return premium data
    const premiumData = generatePremiumData();
    
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: premiumData,
      payment: {
        requestId: requestId,
        paidBy: payment.payer,
        amount: ethers.formatEther(payment.amount) + ' XPL',
        timestamp: new Date(Number(payment.timestamp) * 1000).toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    const price = await contract.price();
    const blockNumber = await provider.getBlockNumber();
    
    res.json({
      status: 'healthy',
      contract: CONTRACT_ADDRESS,
      network: 'Plasma Testnet',
      chainId: 9746,
      price: ethers.formatEther(price) + ' XPL',
      currentBlock: blockNumber,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * Serve frontend
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Plasma x402 Premium Data API Gateway');
  console.log('='.repeat(50));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📝 Contract: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 Network: Plasma Testnet`);
  console.log(`💰 Price: ${PRICE_XPL} XPL per request`);
  console.log('='.repeat(50));
  console.log('\n📖 Endpoints:');
  console.log(`   GET  /                       → Frontend UI`);
  console.log(`   GET  /health                 → Health check`);
  console.log(`   GET  /api/premium-data       → Premium data (x402)`);
  console.log('\n✨ Ready to accept payments!\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});
