const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  exportTransactionsToCSV
} = require('../controllers/transactionController');

// All routes are protected
router.use(auth);

// Create a new transaction
router.post('/', createTransaction);

// Get all transactions
router.get('/', getTransactions);

// Get a single transaction
router.get('/:id', getTransactionById);

// Update a transaction
router.put('/:id', updateTransaction);

// Delete a transaction
router.delete('/:id', deleteTransaction);

// Get financial summary
router.get('/summary/financial', getFinancialSummary);

// Export transactions to CSV
router.get('/export/csv', exportTransactionsToCSV);

module.exports = router;