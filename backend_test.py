#!/usr/bin/env python3
import requests
import json
import uuid
import time
from datetime import datetime, timedelta
import os

# Get the base URL from environment variable
BASE_URL = os.environ.get('NEXT_PUBLIC_BASE_URL', 'https://1b4db8d5-11e9-4355-a785-5917853deec7.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

print(f"Testing API at: {API_URL}")

# Helper function to make API requests and handle errors
def make_request(method, endpoint, data=None, params=None):
    url = f"{API_URL}/{endpoint}"
    headers = {'Content-Type': 'application/json'}
    
    try:
        if method == 'GET':
            response = requests.get(url, params=params, headers=headers)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=headers)
        elif method == 'PUT':
            response = requests.put(url, json=data, headers=headers)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        # Print request details
        print(f"\n{method} {url}")
        if data:
            print(f"Request data: {json.dumps(data, indent=2)}")
        
        # Print response details
        print(f"Status code: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response: {response.text}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return None

# Test Transaction CRUD Operations
def test_transactions():
    print("\n===== Testing Transaction CRUD Operations =====")
    
    # Test GET /api/transactions
    print("\n----- Test: Get all transactions -----")
    response = make_request('GET', 'transactions')
    assert response.status_code == 200, "Failed to get transactions"
    transactions = response.json()
    print(f"Found {len(transactions)} transactions")
    
    # Test POST /api/transactions with valid data
    print("\n----- Test: Create transaction with valid data -----")
    new_transaction = {
        "amount": 75.25,
        "description": "Test transaction",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "category": "entertainment"
    }
    response = make_request('POST', 'transactions', data=new_transaction)
    assert response.status_code == 201, "Failed to create transaction"
    created_transaction = response.json()
    transaction_id = created_transaction['id']
    print(f"Created transaction with ID: {transaction_id}")
    
    # Test POST /api/transactions with missing fields
    print("\n----- Test: Create transaction with missing fields -----")
    invalid_transaction = {
        "amount": 50.0,
        "description": "Invalid transaction"
        # Missing date and category
    }
    response = make_request('POST', 'transactions', data=invalid_transaction)
    assert response.status_code == 400, "Should return 400 for missing fields"
    
    # Test PUT /api/transactions/:id with valid data
    print("\n----- Test: Update transaction with valid data -----")
    updated_transaction = {
        "amount": 85.50,
        "description": "Updated test transaction",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "category": "shopping"
    }
    response = make_request('PUT', f'transactions/{transaction_id}', data=updated_transaction)
    assert response.status_code == 200, "Failed to update transaction"
    
    # Test PUT /api/transactions/:id with invalid ID
    print("\n----- Test: Update transaction with invalid ID -----")
    invalid_id = str(uuid.uuid4())
    response = make_request('PUT', f'transactions/{invalid_id}', data=updated_transaction)
    assert response.status_code == 404, "Should return 404 for invalid ID"
    
    # Test DELETE /api/transactions/:id
    print("\n----- Test: Delete transaction -----")
    response = make_request('DELETE', f'transactions/{transaction_id}')
    assert response.status_code == 200, "Failed to delete transaction"
    
    # Test DELETE /api/transactions/:id with invalid ID
    print("\n----- Test: Delete transaction with invalid ID -----")
    response = make_request('DELETE', f'transactions/{invalid_id}')
    assert response.status_code == 404, "Should return 404 for invalid ID"
    
    print("\n✅ Transaction CRUD tests completed successfully")

# Test Categories API
def test_categories():
    print("\n===== Testing Categories API =====")
    
    # Test GET /api/categories
    print("\n----- Test: Get all categories -----")
    response = make_request('GET', 'categories')
    assert response.status_code == 200, "Failed to get categories"
    categories = response.json()
    assert len(categories) > 0, "Categories list should not be empty"
    
    # Verify category structure
    for category in categories:
        assert 'id' in category, "Category should have an id"
        assert 'name' in category, "Category should have a name"
        assert 'color' in category, "Category should have a color"
    
    print(f"Found {len(categories)} categories")
    print("\n✅ Categories API tests completed successfully")

# Test Budgets CRUD Operations
def test_budgets():
    print("\n===== Testing Budgets CRUD Operations =====")
    
    # Test GET /api/budgets
    print("\n----- Test: Get all budgets -----")
    response = make_request('GET', 'budgets')
    assert response.status_code == 200, "Failed to get budgets"
    budgets = response.json()
    print(f"Found {len(budgets)} budgets")
    
    # Test POST /api/budgets with valid data
    print("\n----- Test: Create budget with valid data -----")
    current_month = datetime.now().strftime("%Y-%m")
    new_budget = {
        "category": "entertainment",
        "amount": 150.00,
        "month": current_month
    }
    response = make_request('POST', 'budgets', data=new_budget)
    assert response.status_code in [200, 201], "Failed to create budget"
    
    # Test POST /api/budgets with missing fields
    print("\n----- Test: Create budget with missing fields -----")
    invalid_budget = {
        "category": "shopping",
        # Missing amount and month
    }
    response = make_request('POST', 'budgets', data=invalid_budget)
    assert response.status_code == 400, "Should return 400 for missing fields"
    
    # Test updating an existing budget
    print("\n----- Test: Update existing budget -----")
    updated_budget = {
        "category": "entertainment",
        "amount": 200.00,
        "month": current_month
    }
    response = make_request('POST', 'budgets', data=updated_budget)
    assert response.status_code == 200, "Failed to update existing budget"
    
    print("\n✅ Budgets CRUD tests completed successfully")

# Test Analytics API
def test_analytics():
    print("\n===== Testing Analytics API =====")
    
    # Test GET /api/analytics
    print("\n----- Test: Get analytics data -----")
    response = make_request('GET', 'analytics')
    assert response.status_code == 200, "Failed to get analytics"
    analytics = response.json()
    
    # Verify analytics structure
    assert 'monthlySpending' in analytics, "Analytics should include monthlySpending"
    assert 'categorySpending' in analytics, "Analytics should include categorySpending"
    assert 'budgetComparison' in analytics, "Analytics should include budgetComparison"
    assert 'totalTransactions' in analytics, "Analytics should include totalTransactions"
    assert 'totalSpent' in analytics, "Analytics should include totalSpent"
    
    # Verify budget comparison calculations
    for budget in analytics['budgetComparison']:
        assert 'spent' in budget, "Budget comparison should include spent amount"
        assert 'remaining' in budget, "Budget comparison should include remaining amount"
        assert 'percentUsed' in budget, "Budget comparison should include percentUsed"
    
    print("\n✅ Analytics API tests completed successfully")

# Run all tests
def run_all_tests():
    print("\n========== STARTING BACKEND API TESTS ==========")
    print(f"Testing against API URL: {API_URL}")
    
    try:
        test_transactions()
        test_categories()
        test_budgets()
        test_analytics()
        
        print("\n========== ALL TESTS COMPLETED SUCCESSFULLY ==========")
        return True
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        return False

if __name__ == "__main__":
    run_all_tests()