-- Market data table for storing Trade Station API data
CREATE TABLE market_data (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  timeframe VARCHAR(20) NOT NULL CHECK (timeframe IN ('daily', '2hour')),
  timestamp TIMESTAMPTZ NOT NULL,
  open DECIMAL(10,2),
  high DECIMAL(10,2),
  low DECIMAL(10,2),
  close DECIMAL(10,2),
  volume BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, timeframe, timestamp)
);

-- Pre-calculated indicators table
CREATE TABLE indicators (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  timeframe VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  sma89 DECIMAL(10,2),
  ema89 DECIMAL(10,2),
  sma2h DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, timeframe, timestamp)
);

-- Create indexes for performance
CREATE INDEX idx_market_data_symbol_timeframe ON market_data(symbol, timeframe);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp);
CREATE INDEX idx_indicators_symbol_timeframe ON indicators(symbol, timeframe);
CREATE INDEX idx_indicators_timestamp ON indicators(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to market_data" ON market_data
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to indicators" ON indicators
  FOR SELECT USING (true);

-- Create policies for service role insert/update access
CREATE POLICY "Allow service role full access to market_data" ON market_data
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to indicators" ON indicators
  FOR ALL USING (auth.role() = 'service_role');
