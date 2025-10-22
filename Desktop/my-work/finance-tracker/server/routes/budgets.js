const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetReport
} = require('../controllers/budgetController');

// All routes are protected
router.use(auth);

// Create a new budget
router.post('/', createBudget);

// Get all budgets
router.get('/', getBudgets);

// Get a single budget
router.get('/:id', getBudgetById);

// Update a budget
router.put('/:id', updateBudget);

// Delete a budget
router.delete('/:id', deleteBudget);

// Get budget report
router.get('/report/summary', getBudgetReport);

module.exports = router;