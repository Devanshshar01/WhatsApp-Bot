const Transaction = require('../models/Transaction');

// Create a new transaction
const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, description, isRecurring, recurrencePattern } = req.body;
    
    const transaction = new Transaction({
      user: req.user._id,
      amount,
      type,
      category,
      date,
      description,
      isRecurring: isRecurring || false,
      recurrencePattern: isRecurring ? recurrencePattern : undefined
    });
    
    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all transactions for a user
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a transaction
const updateTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, description, isRecurring, recurrencePattern } = req.body;
    
    const updateData = {
      amount,
      type,
      category,
      date,
      description
    };
    
    // Only include recurring fields if isRecurring is true
    if (isRecurring) {
      updateData.isRecurring = true;
      updateData.recurrencePattern = recurrencePattern;
    } else {
      updateData.isRecurring = false;
      updateData.recurrencePattern = undefined;
    }
    
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a transaction
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get financial summary (balance, income, expenses)
const getFinancialSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += transaction.amount;
      }
    });
    
    const balance = totalIncome - totalExpenses;
    
    res.json({
      totalIncome,
      totalExpenses,
      balance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Process recurring transactions (to be called by a cron job or scheduled task)
const processRecurringTransactions = async () => {
  try {
    // Get all recurring transactions
    const recurringTransactions = await Transaction.find({ 
      isRecurring: true,
      recurrencePattern: { $exists: true }
    });
    
    const today = new Date();
    const newTransactions = [];
    
    for (const transaction of recurringTransactions) {
      // Check if we need to create a new transaction based on the recurrence pattern
      let shouldCreate = false;
      let newDate = new Date(transaction.date);
      
      switch (transaction.recurrencePattern) {
        case 'daily':
          newDate.setDate(newDate.getDate() + 1);
          shouldCreate = newDate <= today;
          break;
        case 'weekly':
          newDate.setDate(newDate.getDate() + 7);
          shouldCreate = newDate <= today;
          break;
        case 'monthly':
          newDate.setMonth(newDate.getMonth() + 1);
          shouldCreate = newDate <= today;
          break;
        case 'yearly':
          newDate.setFullYear(newDate.getFullYear() + 1);
          shouldCreate = newDate <= today;
          break;
      }
      
      if (shouldCreate) {
        // Create a new transaction
        const newTransaction = new Transaction({
          user: transaction.user,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          date: newDate,
          description: transaction.description,
          isRecurring: true,
          recurrencePattern: transaction.recurrencePattern
        });
        
        newTransactions.push(newTransaction);
      }
    }
    
    // Save all new transactions
    const savedTransactions = await Promise.all(
      newTransactions.map(transaction => transaction.save())
    );
    
    console.log(`Created ${savedTransactions.length} recurring transactions`);
    return savedTransactions;
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
  }
};

// Export transactions to CSV
const exportTransactionsToCSV = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 });
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    
    // Create CSV header
    const csvHeader = 'Date,Type,Category,Amount,Description,Recurring,Recurrence Pattern\n';
    let csvContent = csvHeader;
    
    // Add transaction data
    transactions.forEach(transaction => {
      const row = [
        `"${new Date(transaction.date).toISOString().split('T')[0]}"`,
        `"${transaction.type}"`,
        `"${transaction.category}"`,
        `"${transaction.amount}"`,
        `"${transaction.description || ''}"`,
        `"${transaction.isRecurring ? 'Yes' : 'No'}"`,
        `"${transaction.recurrencePattern || ''}"`
      ].join(',');
      csvContent += row + '\n';
    });
    
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  processRecurringTransactions,
  exportTransactionsToCSV
};