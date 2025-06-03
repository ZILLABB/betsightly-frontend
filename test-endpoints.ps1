# Test BetSightly Backend Endpoints

$baseUrl = "https://betsightly-backend.onrender.com/api"

Write-Host "Testing BetSightly Backend Endpoints" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Test betting codes latest
Write-Host "`nTesting Betting Codes Latest..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/betting-codes/latest/" -Method GET -TimeoutSec 30
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $content = $response.Content | ConvertFrom-Json
    Write-Host "Response keys: $($content.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test betting codes with parameters
Write-Host "`nTesting Betting Codes with params..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/betting-codes/?limit=10&skip=0" -Method GET -TimeoutSec 30
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $content = $response.Content | ConvertFrom-Json
    Write-Host "Response keys: $($content.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test bookmakers
Write-Host "`nTesting Bookmakers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/bookmakers/?limit=10" -Method GET -TimeoutSec 30
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $content = $response.Content | ConvertFrom-Json
    Write-Host "Response keys: $($content.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest completed!" -ForegroundColor Green
