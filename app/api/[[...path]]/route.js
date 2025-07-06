import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const client = new MongoClient(process.env.MONGO_URL);

async function connectToDatabase() {
  try {
    await client.connect();
    return client.db(process.env.DB_NAME || 'financeTracker');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Predefined categories
const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', color: '#FF6B6B' },
  { id: 'transport', name: 'Transportation', color: '#4ECDC4' },
  { id: 'entertainment', name: 'Entertainment', color: '#45B7D1' },
  { id: 'shopping', name: 'Shopping', color: '#96CEB4' },
  { id: 'utilities', name: 'Utilities', color: '#FFEAA7' },
  { id: 'healthcare', name: 'Healthcare', color: '#DDA0DD' },
  { id: 'education', name: 'Education', color: '#98D8C8' },
  { id: 'savings', name: 'Savings', color: '#A8E6CF' },
  { id: 'other', name: 'Other', color: '#FFD93D' }
];

// GET /api/transactions
async function getTransactions(request) {
  try {
    const db = await connectToDatabase();
    const transactions = await db.collection('transactions').find({}).sort({ date: -1 }).toArray();
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST /api/transactions
async function createTransaction(request) {
  try {
    const body = await request.json();
    const { amount, description, date, category } = body;
    
    if (!amount || !description || !date || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const transaction = {
      id: uuidv4(),
      amount: parseFloat(amount),
      description,
      date,
      category,
      createdAt: new Date().toISOString()
    };

    const db = await connectToDatabase();
    await db.collection('transactions').insertOne(transaction);
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

// PUT /api/transactions/:id
async function updateTransaction(request, transactionId) {
  try {
    const body = await request.json();
    const { amount, description, date, category } = body;
    
    if (!amount || !description || !date || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const result = await db.collection('transactions').updateOne(
      { id: transactionId },
      { 
        $set: { 
          amount: parseFloat(amount),
          description,
          date,
          category,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

// DELETE /api/transactions/:id
async function deleteTransaction(request, transactionId) {
  try {
    const db = await connectToDatabase();
    const result = await db.collection('transactions').deleteOne({ id: transactionId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}

// GET /api/categories
async function getCategories(request) {
  return NextResponse.json(CATEGORIES);
}

// GET /api/budgets
async function getBudgets(request) {
  try {
    const db = await connectToDatabase();
    const budgets = await db.collection('budgets').find({}).toArray();
    return NextResponse.json(budgets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

// POST /api/budgets
async function createBudget(request) {
  try {
    const body = await request.json();
    const { category, amount, month } = body;
    
    if (!category || !amount || !month) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const budget = {
      id: uuidv4(),
      category,
      amount: parseFloat(amount),
      month,
      createdAt: new Date().toISOString()
    };

    const db = await connectToDatabase();
    
    // Check if budget already exists for this category and month
    const existingBudget = await db.collection('budgets').findOne({ category, month });
    if (existingBudget) {
      // Update existing budget
      await db.collection('budgets').updateOne(
        { category, month },
        { $set: { amount: parseFloat(amount), updatedAt: new Date().toISOString() } }
      );
      return NextResponse.json({ message: 'Budget updated successfully' });
    } else {
      // Create new budget
      await db.collection('budgets').insertOne(budget);
      return NextResponse.json(budget, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
}

// GET /api/analytics
async function getAnalytics(request) {
  try {
    const db = await connectToDatabase();
    const transactions = await db.collection('transactions').find({}).toArray();
    const budgets = await db.collection('budgets').find({}).toArray();
    
    // Calculate monthly spending
    const monthlySpending = {};
    const categorySpending = {};
    
    transactions.forEach(transaction => {
      const month = transaction.date.substring(0, 7); // YYYY-MM
      if (!monthlySpending[month]) {
        monthlySpending[month] = 0;
      }
      monthlySpending[month] += transaction.amount;
      
      if (!categorySpending[transaction.category]) {
        categorySpending[transaction.category] = 0;
      }
      categorySpending[transaction.category] += transaction.amount;
    });

    // Calculate budget vs actual for current month
    const currentMonth = new Date().toISOString().substring(0, 7);
    const budgetComparison = budgets.map(budget => {
      const spent = categorySpending[budget.category] || 0;
      const remaining = budget.amount - spent;
      const percentUsed = (spent / budget.amount) * 100;
      
      return {
        ...budget,
        spent,
        remaining,
        percentUsed: Math.round(percentUsed)
      };
    });

    return NextResponse.json({
      monthlySpending,
      categorySpending,
      budgetComparison,
      totalTransactions: transactions.length,
      totalSpent: transactions.reduce((sum, t) => sum + t.amount, 0)
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

// Main handler
export async function GET(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/', '');
  
  if (path === 'transactions') {
    return getTransactions(request);
  } else if (path === 'categories') {
    return getCategories(request);
  } else if (path === 'budgets') {
    return getBudgets(request);
  } else if (path === 'analytics') {
    return getAnalytics(request);
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/', '');
  
  if (path === 'transactions') {
    return createTransaction(request);
  } else if (path === 'budgets') {
    return createBudget(request);
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(request) {
  const { pathname } = new URL(request.url);
  const pathParts = pathname.replace('/api/', '').split('/');
  
  if (pathParts[0] === 'transactions' && pathParts[1]) {
    return updateTransaction(request, pathParts[1]);
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request) {
  const { pathname } = new URL(request.url);
  const pathParts = pathname.replace('/api/', '').split('/');
  
  if (pathParts[0] === 'transactions' && pathParts[1]) {
    return deleteTransaction(request, pathParts[1]);
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}