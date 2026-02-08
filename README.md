This project allows Plasma to interact with x402, providing an example app.
A working example is provided on https://plasma-x402-gateway.vercel.app/ which an AI agent may interact with.

API Reference
Complete reference for the Plasma x402 Payment Gateway API.

Base URL
Local Development:
http://localhost:3000
Production:
https://plasma-x402-gateway.vercel.app/ 

Authentication
This API uses x402 payment protocol for authentication. Instead of API keys, clients pay per request using USDT on Plasma blockchain.

**Endpoints**
Health Check
Check gateway status and configuration.
Endpoint: GET /health
Response: 200 OK
json{
  "status": "healthy",
  "contract": "0x84a4622a713f965890a95dc2d022c32e31c4aec9",
  "usdtToken": "0x502012b361aebce43b26ec812b74d9a51db4d412",
  "network": "Plasma Testnet",
  "chainId": 9746,
  "price": "1.0 USDT",
  "currentBlock": 14702036,
  "timestamp": "2026-02-08T01:19:44.408Z"
}

Premium Data (x402 Protected)
Access premium cryptocurrency market data.
Endpoint: GET /api/premium-data
Without Payment
Request:
httpGET /api/premium-data HTTP/1.1
Host: localhost:3000
Response: 402 Payment Required
json{
  "error": "Payment Required",
  "requestId": "0x1f1566abb0c35696df42adb80785df527a45dc883c6c4a6036a3ac9d6f5890a6",
  "payment": {
    "amount": "1.00",
    "currency": "USDT",
    "token": "USDT0",
    "tokenAddress": "0x502012b361aebce43b26ec812b74d9a51db4d412",
    "network": "plasma-testnet",
    "chainId": 9746,
    "contractAddress": "0x84a4622a713f965890a95dc2d022c32e31c4aec9",
    "rpcUrl": "https://testnet-rpc.plasma.to",
    "explorerUrl": "https://testnet.plasmascan.to"
  },
  "instructions": {
    "step1": "Approve contract to spend USDT: usdt.approve(contractAddress, amount)",
    "step2": "Call contract.pay(requestId) to make payment",
    "step3": "Retry this request with X-PAYMENT header containing requestId and txHash"
  },
  "message": "Pay $1 USDT to access premium crypto market data"
}
With Payment
Request:
httpGET /api/premium-data HTTP/1.1
Host: localhost:3000
X-PAYMENT: {"requestId": "0x1f15...", "txHash": "0xb780..."}
Response: 200 OK
json{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "cryptoPrices": {
      "BTC": {
        "price": "45550.93",
        "change24h": "-3.51%",
        "volume24h": "$20.45B"
      },
      "ETH": {
        "price": "2193.89",
        "change24h": "0.03%",
        "volume24h": "$10.26B"
      },
      "USDT": {
        "price": "1.00",
        "change24h": "0.00%",
        "volume24h": "$114.57B"
      }
    },
    "marketData": {
      "totalMarketCap": "$1613.06B",
      "bitcoinDominance": "54.99%",
      "defiTVL": "$108.88B",
      "plasmaActivity": {
        "transactions24h": 517505,
        "usdtVolume": "$515.20M"
      }
    },
    "timestamp": "2026-02-08T01:19:44.408Z",
    "dataProvider": "Premium Crypto Data API",
    "paymentMethod": "USDT via x402 on Plasma",
    "refreshRate": "1 minute"
  },
  "payment": {
    "requestId": "0x1f1566abb0c35696df42adb80785df527a45dc883c6c4a6036a3ac9d6f5890a6",
    "paidBy": "0x803F4C6c1603b36D1fFfCB1EAf453d643179D751",
    "amount": "1.0 USDT",
    "timestamp": "2026-02-08T01:19:41.000Z"
  }
}

Error Responses
400 Bad Request
Invalid payment header format.
json{
  "error": "Invalid payment header format"
}
or
json{
  "error": "Missing requestId in payment"
}
402 Payment Required
Payment not found or not verified.
json{
  "error": "Payment not verified",
  "message": "No payment found for this request ID. Ensure you approved USDT and transaction is confirmed.",
  "requestId": "0x..."
}
500 Internal Server Error
Server-side error occurred.
json{
  "error": "Server error",
  "message": "Detailed error message"
}

Smart Contract Interface
Functions
pay
Make payment for a request ID.
solidityfunction pay(bytes32 requestId) external
Prerequisites:

USDT approval: usdt.approve(contractAddress, amount)

Example (ethers.js):
javascriptconst tx = await contract.pay(requestId);
await tx.wait();
hasPaid
Check if payment exists for request ID.
solidityfunction hasPaid(bytes32 requestId) external view returns (bool)
Example:
javascriptconst paid = await contract.hasPaid(requestId);
getPayment
Get detailed payment information.
solidityfunction getPayment(bytes32 requestId) external view returns (PaymentRecord memory)
Returns:
soliditystruct PaymentRecord {
    address payer;
    uint256 amount;
    uint256 timestamp;
    bool exists;
}
Example:
javascriptconst payment = await contract.getPayment(requestId);
console.log(`Paid by: ${payment.payer}`);
console.log(`Amount: ${ethers.formatUnits(payment.amount, 6)} USDT`);
price
Get current payment price.
solidityfunction price() external view returns (uint256)
Example:
javascriptconst price = await contract.price();
console.log(`Price: ${ethers.formatUnits(price, 6)} USDT`);

Payment Flow Examples
JavaScript (ethers.js)
javascriptconst { ethers } = require('ethers');

// 1. Request data (get 402)
const response = await fetch('http://localhost:3000/api/premium-data');
const paymentInfo = await response.json();

// 2. Connect to contract
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(
  paymentInfo.payment.contractAddress,
  CONTRACT_ABI,
  signer
);
const usdt = new ethers.Contract(
  paymentInfo.payment.tokenAddress,
  USDT_ABI,
  signer
);

// 3. Approve USDT
const price = await contract.price();
const approveTx = await usdt.approve(contract.address, price);
await approveTx.wait();

// 4. Make payment
const payTx = await contract.pay(paymentInfo.requestId);
await payTx.wait();

// 5. Retry with payment proof
const dataResponse = await fetch('http://localhost:3000/api/premium-data', {
  headers: {
    'X-PAYMENT': JSON.stringify({
      requestId: paymentInfo.requestId,
      txHash: payTx.hash
    })
  }
});

const data = await dataResponse.json();
console.log(data);
Python (web3.py)
pythonfrom web3 import Web3
import requests

# 1. Request data
response = requests.get('http://localhost:3000/api/premium-data')
payment_info = response.json()

# 2. Connect to contract
w3 = Web3(Web3.HTTPProvider('https://testnet-rpc.plasma.to'))
contract = w3.eth.contract(
    address=payment_info['payment']['contractAddress'],
    abi=CONTRACT_ABI
)
usdt = w3.eth.contract(
    address=payment_info['payment']['tokenAddress'],
    abi=USDT_ABI
)

# 3. Approve USDT
price = contract.functions.price().call()
approve_tx = usdt.functions.approve(contract.address, price).transact()
w3.eth.wait_for_transaction_receipt(approve_tx)

# 4. Make payment
pay_tx = contract.functions.pay(payment_info['requestId']).transact()
receipt = w3.eth.wait_for_transaction_receipt(pay_tx)

# 5. Retry with payment proof
data_response = requests.get(
    'http://localhost:3000/api/premium-data',
    headers={
        'X-PAYMENT': json.dumps({
            'requestId': payment_info['requestId'],
            'txHash': receipt['transactionHash'].hex()
        })
    }
)

data = data_response.json()
print(data)
cURL
bash# 1. Get payment request
curl http://localhost:3000/api/premium-data

# 2. Approve USDT (use wallet/Remix)

# 3. Make payment (use wallet/Remix)

# 4. Retry with payment proof
curl http://localhost:3000/api/premium-data \
  -H "X-PAYMENT: {\"requestId\":\"0x...\",\"txHash\":\"0x...\"}"

**Rate Limits**
Currently no rate limits enforced. Each request requires a unique payment.

**Versioning**
Current version: 1.0.0
API follows semantic versioning. Breaking changes will increment major version.

**Support**

Issues: GitHub Issues
Discord: Plasma Community


**Changelog**
v1.0.0 (2026-02-08)

Initial release
x402 payment protocol implementation
USDT payment support
Plasma blockchain integration
Human and AI agent interfaces
