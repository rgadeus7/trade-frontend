// Test script to check market-data API
const testAPI = async () => {
  console.log('Testing market-data API...')
  
  // Test symbols - focus on index symbols that need special handling
  const symbols = ['VIX', 'SPX', 'SPY', 'ES']
  
  for (const symbol of symbols) {
    try {
      console.log(`\n--- Testing ${symbol} ---`)
      
      // Test the test-db endpoint first to see what's available
      const testResponse = await fetch(`http://localhost:3000/api/test-db`)
      if (testResponse.ok) {
        const testData = await testResponse.json()
        console.log(`Database status:`, testData)
      }
      
      // Test without auth (should fail)
      const response1 = await fetch(`http://localhost:3000/api/market-data?symbol=${symbol}`)
      console.log(`${symbol} without auth:`, response1.status, response1.statusText)
      
      // Test with dummy auth (should fail but might give us error details)
      const response2 = await fetch(`http://localhost:3000/api/market-data?symbol=${symbol}`, {
        headers: {
          'Authorization': 'Bearer dummy-token',
          'Content-Type': 'application/json'
        }
      })
      console.log(`${symbol} with dummy auth:`, response2.status, response2.statusText)
      
      if (response2.ok) {
        const data = await response2.json()
        console.log(`${symbol} data:`, data)
      } else {
        const errorText = await response2.text()
        console.log(`${symbol} error response:`, errorText)
      }
      
    } catch (error) {
      console.error(`Error testing ${symbol}:`, error.message)
    }
  }
}

// Run the test
testAPI()
