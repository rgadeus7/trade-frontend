// Test script to verify symbol switching works
const testSymbolSwitching = async () => {
  console.log('Testing symbol switching functionality...\n')
  
  // Test different symbols
  const symbols = ['VIX', 'SPX', 'SPY', 'ES']
  
  for (const symbol of symbols) {
    console.log(`--- Testing ${symbol} ---`)
    
    // Simulate the symbol mapping that happens in the component
    const currentSymbol = symbol
    console.log(`Current symbol: ${currentSymbol}`)
    
    // Simulate the symbol mapping in timeframeDataService
    const symbolMap = {
      'SPY': 'SPY',
      'SPX': '$SPX.X',
      'ES': '@ES',
      'VIX': '$VIX.X'
    }
    
    const dbSymbol = symbolMap[symbol] || symbol
    console.log(`Database symbol: ${dbSymbol}`)
    
    // Test the API endpoint
    try {
      const response = await fetch(`http://localhost:3000/api/market-data?symbol=${symbol}`)
      console.log(`API Response Status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`Data received: ${data.length} records`)
        if (data.length > 0) {
          console.log(`First record symbol: ${data[0].symbol}`)
          console.log(`First record price: $${data[0].close}`)
        }
      } else {
        console.log(`API Error: ${response.statusText}`)
      }
    } catch (error) {
      console.log(`Fetch Error: ${error.message}`)
    }
    
    console.log('')
  }
  
  console.log('Symbol switching test completed!')
}

// Run the test
testSymbolSwitching().catch(console.error)
