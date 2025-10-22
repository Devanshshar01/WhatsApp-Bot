import React, { useState } from 'react';
import EditTransactionModal from './EditTransactionModal';

const TransactionList = ({ transactions, onDelete, onEdit }) => {
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };
  
  // Get emoji based on category
  const getCategoryEmoji = (category, type) => {
    if (type === 'income') {
      if (category.includes('Salary')) return '💼';
      if (category.includes('Freelance')) return '💻';
      if (category.includes('Investment')) return '📊';
      if (category.includes('Gift')) return '🎁';
      if (category.includes('Bonus')) return '🎉';
      return '💰';
    } else {
      if (category.includes('Food')) return '🍔';
      if (category.includes('Shopping')) return '🛍️';
      if (category.includes('Transportation')) return '🚗';
      if (category.includes('Entertainment')) return '🎬';
      if (category.includes('Bills')) return '🧾';
      if (category.includes('Healthcare')) return '🏥';
      if (category.includes('Education')) return '📚';
      if (category.includes('Travel')) return '✈️';
      if (category.includes('Groceries')) return '🛒';
      if (category.includes('Fuel')) return '⛽';
      if (category.includes('Rent')) return '🏠';
      if (category.includes('EMI')) return '💳';
      if (category.includes('Insurance')) return '🛡️';
      return '💸';
    }
  };
  
  return (
    <div className="card overflow-hidden fade-in">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                Amount (₹)
              </th>
              <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">💸</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No transactions found</h3>
                    <p className="text-gray-600 mb-6 max-w-md">Add your first transaction (₹) to get started and watch your finances grow!</p>
                    <div className="inline-flex items-center text-indigo-600 font-medium">
                      <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Tip: Track every rupee to build better financial habits!</span>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction._id} className="transaction-row hover:bg-indigo-50 transition-all duration-200">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getCategoryEmoji(transaction.category, transaction.type)}</span>
                      <div>
                        <div className="text-base font-bold text-gray-900 flex items-center">
                          {transaction.description || 'No description'}
                          {transaction.isRecurring && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full" title="Recurring transaction">
                              ↻
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`badge-${transaction.type} flex items-center`}>
                      <span className="mr-1">{getCategoryEmoji(transaction.category, transaction.type)}</span>
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-base text-gray-600">
                    {formatDate(transaction.date)}
                    {transaction.isRecurring && (
                      <div className="text-xs text-gray-500 mt-1">
                        Recurring ({transaction.recurrencePattern})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className={`text-lg font-bold ${transaction.type === 'income' ? 'transaction-income' : 'transaction-expense'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-base">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition-colors"
                        title="Edit transaction"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(transaction._id)}
                        className="text-rose-600 hover:text-rose-900 p-2 rounded-full hover:bg-rose-100 transition-colors"
                        title="Delete transaction"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onUpdate={() => {
            setEditingTransaction(null);
            onEdit(); // Refresh data after update
          }}
        />
      )}
    </div>
  );
};

export default TransactionList;