const axios = require('axios');

const GATEWAY_URL = 'http://localhost:3000/api/premium-data';

async function testGateway() {
  console.log('🧪 Testing x402 Gateway\n');
  
  // Test 1: Get 402 response (no payment)
  console.log('Test 1: Request without payment...');
  try {
    const response1 = await axios.get(GATEWAY_URL);
    console.log('❌ Should have gotten 402!');
  } catch (error) {
    if (error.response && error.response.status === 402) {
      console.log('✅ Got 402 Payment Required');
      console.log('📝 Request ID:', error.response.data.requestId);
      console.log('\n---\n');
      
      // Test 2: Try with payment header
      const requestId = error.response.data.requestId;
      console.log('Test 2: Request WITH payment header...');
      console.log('Using request ID:', requestId);
      
      // First, you need to actually PAY in Remix!
      console.log('\n⚠️  PAUSE: Now go to Remix and:');
      console.log('   1. Call pay() function');
      console.log('   2. Use requestId:', requestId);
      console.log('   3. Set value: 0.01 Ether');
      console.log('   4. Confirm transaction in MetaMask');
      console.log('   5. Wait for confirmation\n');
      console.log('Then run: node test-with-payment.js', requestId);
    }
  }
}

// If request ID provided as argument, test with payment
if (process.argv[2]) {
  const requestId = process.argv[2];
  console.log('🧪 Testing with payment for request:', requestId);
  
  axios.get(GATEWAY_URL, {
    headers: {
      'X-PAYMENT': JSON.stringify({ requestId })
    }
  })
  .then(response => {
    console.log('✅ SUCCESS! Got premium content:');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    if (error.response) {
      console.log('❌ Error:', error.response.status);
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Error:', error.message);
    }
  });
} else {
  testGateway();
}
