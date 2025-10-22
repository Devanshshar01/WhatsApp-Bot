import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authService';
import { getTransactions, getFinancialSummary, deleteTransaction, exportTransactionsToCSV } from '../services/transactionService';
import TransactionList from '../components/TransactionList';
import FinancialSummary from '../components/FinancialSummary';
import AddTransactionModal from '../components/AddTransactionModal';
import TransactionChart from '../components/TransactionChart';
import BudgetList from '../components/BudgetList';
import BudgetReport from '../components/BudgetReport';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingsGoal, setSavingsGoal] = useState(100000); // Default savings goal of ₹100,000
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, budgets, report
  const [exportLoading, setExportLoading] = useState(false);
  
  const { user, logout } = useAuth();
  
  // Calculate savings progress
  const savingsProgress = financialSummary.balance > 0 
    ? Math.min((financialSummary.balance / savingsGoal) * 100, 100) 
    : 0;
  
  // Fetch transactions and financial summary
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [transactionsData, summaryData] = await Promise.all([
        getTransactions(),
        getFinancialSummary()
      ]);
      
      setTransactions(transactionsData);
      setFinancialSummary(summaryData);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a transaction
  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(transaction => transaction._id !== id));
      // Refresh financial summary
      const summaryData = await getFinancialSummary();
      setFinancialSummary(summaryData);
    } catch (err) {
      setError('Failed to delete transaction');
      console.error(err);
    }
  };
  
  // Export transactions to CSV
  const handleExportToCSV = async () => {
    try {
      setExportLoading(true);
      await exportTransactionsToCSV();
    } catch (err) {
      setError('Failed to export transactions');
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="floating mb-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto">
              <svg className="h-12 w-12 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Loading your finances...</h2>
          <p className="text-indigo-100 mt-2">Getting your money game ready! ✨</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="dashboard-header shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center md:justify-start">
                <span className="sparkle">💰</span> Finance Tracker (₹)
              </h1>
              <p className="text-indigo-100 mt-2 text-lg">Track your income and expenses with style!</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-center sm:text-right">
                <p className="text-white font-bold text-lg">{user?.username}</p>
                <p className="text-indigo-200">Personal Account</p>
              </div>
              <button
                onClick={logout}
                className="btn-outline bg-white text-indigo-600 hover:bg-indigo-50 border-white font-bold"
              >
                👋 Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-2xl bg-rose-50 p-6 mb-8 shadow-lg fade-in">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-rose-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-rose-700 font-medium">
                {error}
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('budgets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'budgets'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Budgets
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'report'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Budget Report
              </button>
            </nav>
          </div>
        </div>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Savings Goal Progress */}
            <div className="mb-8 card p-6 fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Savings Goal Tracker</h2>
                  <p className="text-gray-600">Keep saving towards your goals! 🎯</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 font-medium">Goal: ₹{savingsGoal.toLocaleString('en-IN')}</span>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{savingsProgress.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${savingsProgress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>₹{financialSummary.balance.toLocaleString('en-IN')}</span>
                <span>₹{savingsGoal.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            {/* Financial Summary */}
            <div className="mb-8 fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                💼 Financial Overview
              </h2>
              <FinancialSummary summary={financialSummary} />
            </div>
            
            {/* Charts */}
            <div className="mb-8 fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                📊 Financial Trends
              </h2>
              <TransactionChart transactions={transactions} />
            </div>
            
            {/* Transactions Section */}
            <div className="fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    📋 Recent Transactions (₹)
                  </h2>
                  <p className="text-gray-600">Manage your income and expenses</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportToCSV}
                    disabled={exportLoading}
                    className="btn-outline flex items-center gap-2"
                  >
                    {exportLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2 pulse"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Transaction
                  </button>
                </div>
              </div>
              
              <TransactionList 
                transactions={transactions} 
                onDelete={handleDeleteTransaction}
                onEdit={() => fetchDashboardData()} // Refresh data after edit
              />
            </div>
          </>
        )}
        
        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              💰 Budget Management
            </h2>
            <BudgetList onBudgetUpdate={fetchDashboardData} />
          </div>
        )}
        
        {/* Budget Report Tab */}
        {activeTab === 'report' && (
          <div className="fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              📊 Budget vs Spending Report
            </h2>
            <BudgetReport />
          </div>
        )}
      </main>
      
      {/* Fun footer */}
      <footer className="mt-12 py-8 text-center text-gray-600">
        <p className="flex items-center justify-center gap-2">
          Made with <span className="text-red-500">❤️</span> and <span className="text-yellow-500">💰</span> | Finance Tracker © {new Date().getFullYear()}
        </p>
        <p className="mt-2 text-sm">Keep track, stay rich! 🚀</p>
      </footer>
      
      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal 
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            setShowAddModal(false);
            fetchDashboardData(); // Refresh data after adding
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;