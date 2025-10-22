import React, { useState } from 'react';
import { createTransaction } from '../services/transactionService';

const AddTransactionModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    isRecurring: false,
    recurrencePattern: 'monthly'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { amount, type, category, date, description, isRecurring, recurrencePattern } = formData;
  
  const onChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: inputType === 'checkbox' ? checked : value 
    });
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validation
    if (!amount || !category || !date) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }
    
    try {
      await createTransaction(formData);
      onAdd();
    } catch (err) {
      setError(err.message || 'Failed to add transaction');
      setLoading(false);
    }
  };
  
  // Fun emojis for transaction types
  const getTypeEmoji = (type) => {
    return type === 'income' ? '📥' : '📤';
  };
  
  // Common categories for expenses in India
  const expenseCategories = [
    'Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 
    'Groceries', 'Fuel', 'Rent', 'EMI', 'Insurance', 'Other'
  ];
  
  // Common categories for income in India
  const incomeCategories = [
    'Salary', 'Freelance', 'Investment', 'Gift', 'Bonus', 'Other'
  ];
  
  const categories = type === 'income' ? incomeCategories : expenseCategories;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              {getTypeEmoji(type)} Add Transaction (₹)
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 space-y-6">
            {error && (
              <div className="rounded-xl bg-rose-50 p-4 border border-rose-100">
                <div className="text-rose-700 font-medium flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="amount" className="block text-sm font-bold text-gray-700 mb-2">
                Amount (₹) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold">₹</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={amount}
                  onChange={onChange}
                  step="0.01"
                  min="0"
                  className="form-input pl-10 text-lg"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`py-4 px-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${
                    type === 'income'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md transform scale-105'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">📥</div>
                  <div className="font-bold">Income</div>
                  <div className="text-xs mt-1">Money in</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`py-4 px-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${
                    type === 'expense'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-md transform scale-105'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">📤</div>
                  <div className="font-bold">Expense</div>
                  <div className="text-xs mt-1">Money out</div>
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-bold text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={onChange}
                className="form-input text-base"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-bold text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={date}
                onChange={onChange}
                className="form-input"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={onChange}
                rows="3"
                className="form-input"
                placeholder="What was this transaction for?"
              />
            </div>
            
            {/* Recurring Transaction Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center">
                <input
                  id="isRecurring"
                  name="isRecurring"
                  type="checkbox"
                  checked={isRecurring}
                  onChange={onChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isRecurring" className="ml-2 block text-sm font-medium text-gray-700">
                  Make this a recurring transaction
                </label>
              </div>
              
              {isRecurring && (
                <div className="mt-4 ml-6">
                  <label htmlFor="recurrencePattern" className="block text-sm font-medium text-gray-700 mb-2">
                    Recurrence Pattern
                  </label>
                  <select
                    id="recurrencePattern"
                    name="recurrencePattern"
                    value={recurrencePattern}
                    onChange={onChange}
                    className="form-input"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-500">
                    This transaction will automatically repeat based on the selected pattern.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-5 bg-gray-50 flex justify-end space-x-4 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline py-3 px-6"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center py-3 px-6"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;