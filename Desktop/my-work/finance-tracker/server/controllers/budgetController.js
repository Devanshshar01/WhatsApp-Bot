const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// Create a new budget
const createBudget = async (req, res) => {
  try {
    const { category, amount, period, startDate, endDate } = req.body;
    
    const budget = new Budget({
      user: req.user._id,
      category,
      amount,
      period,
      startDate,
      endDate
    });
    
    const savedBudget = await budget.save();
    res.status(201).json(savedBudget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all budgets for a user
const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user._id, isActive: true })
      .sort({ category: 1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single budget by ID
const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a budget
const updateBudget = async (req, res) => {
  try {
    const { category, amount, period, startDate, endDate, isActive } = req.body;
    
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { category, amount, period, startDate, endDate, isActive },
      { new: true, runValidators: true }
    );
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a budget
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get budget vs actual spending report
const getBudgetReport = async (req, res) => {
  try {
    const budgets = await Budget.find({ 
      user: req.user._id, 
      isActive: true 
    });
    
    // Get current month transactions
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const transactions = await Transaction.find({ 
      user: req.user._id,
      date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
      type: 'expense'
    });
    
    // Calculate spending by category
    const spendingByCategory = {};
    transactions.forEach(transaction => {
      if (!spendingByCategory[transaction.category]) {
        spendingByCategory[transaction.category] = 0;
      }
      spendingByCategory[transaction.category] += transaction.amount;
    });
    
    // Create budget report
    const budgetReport = budgets.map(budget => {
      const actualSpending = spendingByCategory[budget.category] || 0;
      const remaining = budget.amount - actualSpending;
      const percentageUsed = budget.amount > 0 ? (actualSpending / budget.amount) * 100 : 0;
      
      return {
        ...budget.toObject(),
        actualSpending,
        remaining,
        percentageUsed,
        status: percentageUsed > 100 ? 'exceeded' : percentageUsed > 80 ? 'warning' : 'good'
      };
    });
    
    res.json(budgetReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetReport
};