'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Edit, Trash2, Plus, DollarSign, TrendingUp, CreditCard, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: ''
  });

  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
    month: new Date().toISOString().substring(0, 7)
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, categoriesRes, budgetsRes, analyticsRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/categories'),
        fetch('/api/budgets'),
        fetch('/api/analytics')
      ]);

      const [transactionsData, categoriesData, budgetsData, analyticsData] = await Promise.all([
        transactionsRes.json(),
        categoriesRes.json(),
        budgetsRes.json(),
        analyticsRes.json()
      ]);

      setTransactions(transactionsData);
      setCategories(categoriesData);
      setBudgets(budgetsData);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!transactionForm.amount || !transactionForm.description || !transactionForm.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsAddingTransaction(true);
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionForm)
      });

      if (response.ok) {
        toast.success('Transaction added successfully');
        setTransactionForm({
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          category: ''
        });
        await fetchData();
      } else {
        toast.error('Failed to add transaction');
      }
    } catch (error) {
      toast.error('Error adding transaction');
    } finally {
      setIsAddingTransaction(false);
    }
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionForm)
      });

      if (response.ok) {
        toast.success('Transaction updated successfully');
        setEditingTransaction(null);
        setTransactionForm({
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          category: ''
        });
        await fetchData();
      } else {
        toast.error('Failed to update transaction');
      }
    } catch (error) {
      toast.error('Error updating transaction');
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Transaction deleted successfully');
        await fetchData();
      } else {
        toast.error('Failed to delete transaction');
      }
    } catch (error) {
      toast.error('Error deleting transaction');
    }
  };

  const handleAddBudget = async () => {
    if (!budgetForm.category || !budgetForm.amount || !budgetForm.month) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsAddingBudget(true);
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetForm)
      });

      if (response.ok) {
        toast.success('Budget set successfully');
        setBudgetForm({
          category: '',
          amount: '',
          month: new Date().toISOString().substring(0, 7)
        });
        await fetchData();
      } else {
        toast.error('Failed to set budget');
      }
    } catch (error) {
      toast.error('Error setting budget');
    } finally {
      setIsAddingBudget(false);
    }
  };

  const startEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date,
      category: transaction.category
    });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : '#666';
  };

  // Prepare chart data
  const monthlyChartData = Object.entries(analytics.monthlySpending || {}).map(([month, amount]) => ({
    month,
    amount
  }));

  const categoryChartData = Object.entries(analytics.categorySpending || {}).map(([category, amount]) => ({
    name: getCategoryName(category),
    value: amount,
    color: getCategoryColor(category)
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Personal Finance Tracker</h1>
          <p className="text-gray-600">Track your expenses, manage budgets, and gain insights into your spending habits</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics.totalSpent?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalTransactions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Budgets</p>
                  <p className="text-2xl font-bold text-gray-900">{budgets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(analytics.categorySpending || {}).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transaction Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                      placeholder="What did you spend on?"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={transactionForm.category} onValueChange={(value) => setTransactionForm({...transactionForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{backgroundColor: category.color}}></div>
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
                      disabled={isAddingTransaction}
                      className="flex-1"
                    >
                      {editingTransaction ? 'Update' : 'Add'} Transaction
                    </Button>
                    {editingTransaction && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditingTransaction(null);
                          setTransactionForm({
                            amount: '',
                            description: '',
                            date: new Date().toISOString().split('T')[0],
                            category: ''
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Transaction List */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {transactions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No transactions yet. Add your first transaction!</p>
                    ) : (
                      transactions.map(transaction => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{backgroundColor: getCategoryColor(transaction.category)}}
                            ></div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-500">{getCategoryName(transaction.category)} • {transaction.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-red-600">-${transaction.amount.toFixed(2)}</span>
                            <Button size="sm" variant="outline" onClick={() => startEditTransaction(transaction)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteTransaction(transaction.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Spending Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Spending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                        <Bar dataKey="amount" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Spending Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Budget Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Set Budget
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="budget-category">Category</Label>
                    <Select value={budgetForm.category} onValueChange={(value) => setBudgetForm({...budgetForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{backgroundColor: category.color}}></div>
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="budget-amount">Monthly Budget ($)</Label>
                    <Input
                      id="budget-amount"
                      type="number"
                      step="0.01"
                      value={budgetForm.amount}
                      onChange={(e) => setBudgetForm({...budgetForm, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="budget-month">Month</Label>
                    <Input
                      id="budget-month"
                      type="month"
                      value={budgetForm.month}
                      onChange={(e) => setBudgetForm({...budgetForm, month: e.target.value})}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleAddBudget}
                    disabled={isAddingBudget}
                    className="w-full"
                  >
                    Set Budget
                  </Button>
                </CardContent>
              </Card>

              {/* Budget Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analytics.budgetComparison?.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No budgets set yet. Create your first budget!</p>
                    ) : (
                      analytics.budgetComparison?.map(budget => (
                        <div key={budget.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{backgroundColor: getCategoryColor(budget.category)}}
                              ></div>
                              <span className="font-medium">{getCategoryName(budget.category)}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">${budget.spent.toFixed(2)} of ${budget.amount.toFixed(2)}</p>
                              <Badge variant={budget.percentUsed > 100 ? 'destructive' : budget.percentUsed > 80 ? 'default' : 'secondary'}>
                                {budget.percentUsed}% used
                              </Badge>
                            </div>
                          </div>
                          <Progress value={Math.min(budget.percentUsed, 100)} className="h-2" />
                          {budget.percentUsed > 100 && (
                            <p className="text-sm text-red-600">Over budget by ${(budget.spent - budget.amount).toFixed(2)}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spending Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Top Spending Category</h4>
                      <p className="text-blue-700">
                        {categoryChartData.length > 0 && 
                          `${categoryChartData.reduce((prev, current) => prev.value > current.value ? prev : current).name} - $${categoryChartData.reduce((prev, current) => prev.value > current.value ? prev : current).value.toFixed(2)}`
                        }
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900">Average Transaction</h4>
                      <p className="text-green-700">
                        ${analytics.totalTransactions > 0 ? (analytics.totalSpent / analytics.totalTransactions).toFixed(2) : '0.00'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900">Budget Status</h4>
                      <p className="text-purple-700">
                        {analytics.budgetComparison?.filter(b => b.percentUsed > 100).length || 0} budgets exceeded
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.budgetComparison?.some(b => b.percentUsed > 100) && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-900">Budget Alert</h4>
                        <p className="text-red-700">You've exceeded some budgets. Consider reviewing your spending in these categories.</p>
                      </div>
                    )}
                    
                    {Object.keys(analytics.categorySpending || {}).length > 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-semibold text-yellow-900">Diversify Spending</h4>
                        <p className="text-yellow-700">Track more categories to get better insights into your spending patterns.</p>
                      </div>
                    )}
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Set More Budgets</h4>
                      <p className="text-blue-700">Create budgets for all your spending categories to better control your finances.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}