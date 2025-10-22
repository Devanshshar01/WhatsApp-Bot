import React from 'react';

const FinancialSummary = ({ summary }) => {
  const { totalIncome, totalExpenses, balance } = summary;
  
  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };
  
  // Determine balance color
  const balanceColor = balance >= 0 ? 'text-emerald-600' : 'text-rose-600';
  const balanceBg = balance >= 0 ? 'summary-card-balance' : 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100';
  
  // Fun emojis based on financial status
  const getBalanceEmoji = () => {
    if (balance >= 100000) return '💰👑';
    if (balance >= 50000) return '💰✨';
    if (balance >= 10000) return '💰';
    if (balance >= 0) return '😊';
    if (balance >= -10000) return '😅';
    return '😱';
  };
  
  const getIncomeEmoji = () => {
    if (totalIncome >= 100000) return '🚀';
    if (totalIncome >= 50000) return '📈';
    if (totalIncome >= 10000) return '💹';
    return '💰';
  };
  
  const getExpenseEmoji = () => {
    if (totalExpenses >= 100000) return '💸🔥';
    if (totalExpenses >= 50000) return '💸';
    if (totalExpenses >= 10000) return '🛒';
    return '📉';
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Balance */}
      <div className={`summary-card ${balanceBg} bounce-in`}>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 truncate flex items-center">
                Total Balance (₹) <span className="ml-2">{getBalanceEmoji()}</span>
              </p>
              <p className={`text-4xl font-bold mt-2 ${balanceColor}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="bg-indigo-100 p-4 rounded-2xl">
              <svg className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Updated just now</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Total Income */}
      <div className="summary-card summary-card-income bounce-in">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 truncate flex items-center">
                Total Income (₹) <span className="ml-2">{getIncomeEmoji()}</span>
              </p>
              <p className="text-4xl font-bold mt-2 text-emerald-600">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="bg-emerald-100 p-4 rounded-2xl">
              <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>All time income</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Total Expenses */}
      <div className="summary-card summary-card-expense bounce-in">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 truncate flex items-center">
                Total Expenses (₹) <span className="ml-2">{getExpenseEmoji()}</span>
              </p>
              <p className="text-4xl font-bold mt-2 text-rose-600">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="bg-rose-100 p-4 rounded-2xl">
              <svg className="h-10 w-10 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>All time expenses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;