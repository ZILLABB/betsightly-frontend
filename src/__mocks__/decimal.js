// Mock implementation of decimal.js for testing 
class Decimal { 
  constructor(value) { 
    this.value = Number(value); 
  } 
 
  plus(n) { 
    return new Decimal(this.value + Number(n)); 
  } 
 
  minus(n) { 
    return new Decimal(this.value - Number(n)); 
  } 
 
  times(n) { 
    return new Decimal(this.value * Number(n)); 
  } 
 
  div(n) { 
    return new Decimal(this.value / Number(n)); 
  } 
 
  toNumber() { 
    return this.value; 
  } 
 
  toString() { 
    return String(this.value); 
  } 
 
  toFixed(dp) { 
    return this.value.toFixed(dp); 
  } 
} 
 
// Add static properties 
Decimal.ROUND_UP = 0; 
Decimal.ROUND_DOWN = 1; 
Decimal.ROUND_CEIL = 2; 
Decimal.ROUND_FLOOR = 3; 
Decimal.ROUND_HALF_UP = 4; 
Decimal.ROUND_HALF_DOWN = 5; 
Decimal.ROUND_HALF_EVEN = 6; 
Decimal.ROUND_HALF_CEIL = 7; 
Decimal.ROUND_HALF_FLOOR = 8; 
 
export default Decimal; 
