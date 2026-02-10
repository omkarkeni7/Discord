# Test the Deadline Alert System

Write-Host "`n=== Testing Deadline Alert System ===" -ForegroundColor Cyan

# Test 1: Sync test projects
Write-Host "`n1. Syncing test projects..." -ForegroundColor Yellow

$projects = @{
    projects = @(
        @{
            id = "test-1day"
            name = "Urgent Project - Due Tomorrow"
            deadline = "2026-02-11"
            assignedUsers = @("123456789")
        },
        @{
            id = "test-3day"
            name = "Important Project - Due in 3 Days"  
            deadline = "2026-02-13"
            assignedUsers = @("123456789", "987654321")
        }
    )
}

$body = $projects | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/sync" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Projects synced: $($response.count) projects" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to sync projects: $_" -ForegroundColor Red
    exit 1
}

# Test 2: View synced projects
Write-Host "`n2. Viewing synced projects..." -ForegroundColor Yellow

try {
    $projects = Invoke-RestMethod -Uri "http://localhost:3000/api/projects" -Method GET
    Write-Host "✅ Found $($projects.projects.Count) projects:" -ForegroundColor Green
    $projects.projects | ForEach-Object {
        Write-Host "   - $($_.name) (Deadline: $($_.deadline))" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to get projects: $_" -ForegroundColor Red
}

# Test 3: Manual deadline check
Write-Host "`n3. Triggering manual deadline check..." -ForegroundColor Yellow
Write-Host "   (Check #deadline-tracker channel in Discord for alerts)" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/deadlines/check" -Method POST
    Write-Host "✅ $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to check deadlines: $_" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Check the #deadline-tracker channel in Discord for alert messages" -ForegroundColor White
Write-Host "2. Verify that users are mentioned correctly" -ForegroundColor White
Write-Host "3. Run this script again to verify duplicate prevention" -ForegroundColor White
Write-Host ""
