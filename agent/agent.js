const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

// Configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000/api/premium-data';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const USDT_ADDRESS = '0x502012b361aebce43b26ec812b74d9a51db4d412'; // USDT0 on Plasma testnet
const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
const PLASMA_RPC = process.env.PLASMA_RPC_URL || 'https://testnet-rpc.plasma.to';

// Contract ABIs
const CONTRACT_ABI = [
    "function pay(bytes32 requestId)",
    "function hasPaid(bytes32 requestId) view returns (bool)",
    "function price() view returns (uint256)"
];

const USDT_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

// AI Agent Class
class X402AgentUSDT {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(PLASMA_RPC);
        this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);
        this.usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, this.wallet);
    }

    async run() {
        console.log('\n🤖 AI Agent Starting (USDT Payment Mode)...');
        console.log('='.repeat(60));
        console.log(`📍 Agent Address: ${this.wallet.address}`);
        console.log(`🌐 Gateway: ${GATEWAY_URL}`);
        console.log(`📝 Payment Contract: ${CONTRACT_ADDRESS}`);
        console.log(`💵 USDT Token: ${USDT_ADDRESS}`);
        console.log('='.repeat(60) + '\n');

        try {
            // Check USDT balance
            await this.checkBalances();

            // Step 1: Discover service
            console.log('🔍 Step 1: Discovering service...');
            const discoveryResponse = await this.discoverService();
            
            if (discoveryResponse.status === 402) {
                console.log('✅ Service discovered! Payment required.');
                await this.handlePayment(discoveryResponse.data);
            } else {
                console.log('❌ Unexpected response:', discoveryResponse.status);
            }

        } catch (error) {
            console.error('❌ Agent error:', error.message);
            process.exit(1);
        }
    }

    async checkBalances() {
        const balance = await this.usdtContract.balanceOf(this.wallet.address);
        const balanceFormatted = ethers.formatUnits(balance, 6); // USDT has 6 decimals
        console.log(`💰 Agent USDT Balance: ${balanceFormatted} USDT\n`);

        if (parseFloat(balanceFormatted) < 1) {
            console.log('⚠️  Warning: Insufficient USDT balance!');
            console.log('   You need at least 1 USDT to make payment.');
            console.log('   Get USDT from Plasma testnet faucet or bridge.\n');
        }
    }

    async discoverService() {
        try {
            const response = await axios.get(GATEWAY_URL);
            return response;
        } catch (error) {
            if (error.response && error.response.status === 402) {
                return error.response;
            }
            throw error;
        }
    }

    async handlePayment(paymentData) {
        console.log('💳 Step 2: Processing USDT payment...');
        console.log(`   Request ID: ${paymentData.requestId}`);
        console.log(`   Amount: ${paymentData.payment.amount} ${paymentData.payment.currency}`);
        console.log(`   Token: ${paymentData.payment.token}`);

        try {
            const price = await this.contract.price();
            console.log(`   Price from contract: ${ethers.formatUnits(price, 6)} USDT`);

            // Check if already approved
            const allowance = await this.usdtContract.allowance(this.wallet.address, CONTRACT_ADDRESS);
            
            if (allowance < price   ) {
                console.log('\n🔐 Step 2a: Approving USDT spending...');
                const approveTx = await this.usdtContract.approve(CONTRACT_ADDRESS, price);
                console.log(`   Approval TX: ${approveTx.hash}`);
                console.log('   Waiting for approval confirmation...');
                await approveTx.wait();
                console.log('✅ USDT spending approved!\n');
            } else {
                console.log('✅ USDT already approved!\n');
            }

            // Make payment
            console.log('📤 Step 2b: Sending payment transaction...');
            const tx = await this.contract.pay(paymentData.requestId);
            console.log(`   Payment TX Hash: ${tx.hash}`);
            console.log('   Waiting for confirmation...');

            const receipt = await tx.wait();
            console.log(`✅ Payment confirmed! Block: ${receipt.blockNumber}`);

            // Access data
            await this.accessData(paymentData.requestId, tx.hash);

        } catch (error) {
            console.error('❌ Payment failed:', error.message);
            
            if (error.message.includes('insufficient')) {
                console.log('\n💡 Tip: Make sure you have enough USDT in your wallet!');
            }
        }
    }

    async accessData(requestId, txHash) {
        console.log('\n📊 Step 3: Accessing premium data...');

        try {
            const response = await axios.get(GATEWAY_URL, {
                headers: {
                    'X-PAYMENT': JSON.stringify({ requestId, txHash })
                }
            });

            if (response.status === 200) {
                console.log('✅ Data access successful!\n');
                console.log('='.repeat(60));
                console.log('📦 PREMIUM DATA RECEIVED:');
                console.log('='.repeat(60));
                console.log(JSON.stringify(response.data, null, 2));
                console.log('='.repeat(60) + '\n');

                console.log('🎉 AI Agent completed successfully!');
                console.log('💡 The agent autonomously:');
                console.log('   1. Discovered the service');
                console.log('   2. Approved USDT spending');
                console.log('   3. Made payment with USDT');
                console.log('   4. Accessed premium data');
                console.log('   All without human intervention!\n');
            } else {
                console.log('❌ Unexpected response:', response.status);
            }

        } catch (error) {
            if (error.response) {
                console.error('❌ Access denied:', error.response.data);
            } else {
                console.error('❌ Request failed:', error.message);
            }
        }
    }
}

// Validation
function validateConfig() {
    const missing = [];
    
    if (!CONTRACT_ADDRESS) missing.push('CONTRACT_ADDRESS');
    if (!PRIVATE_KEY) missing.push('PRIVATE_KEY or AGENT_PRIVATE_KEY');
    
    if (missing.length > 0) {
        console.error('\n❌ Missing configuration:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\n💡 Add these to your .env file');
        console.error('\n📝 Also ensure your wallet has USDT on Plasma testnet!\n');
        process.exit(1);
    }
}

// Main
async function main() {
    validateConfig();
    
    const agent = new X402AgentUSDT();
    await agent.run();
}

// Run
if (require.main === module) {
    main();
}

module.exports = { X402AgentUSDT };
