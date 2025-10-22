import React, { useState, useEffect } from 'react';
import { getBudgetReport } from '../services/budgetService';

const BudgetReport = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch budget report
  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await getBudgetReport();
      setReport(data);
      setError('');
    } catch (err) {
      setError('Failed to load budget report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="text-red-700">{error}</div>
      </div>
    );
  }

  if (report.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-5xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No budget data</h3>
        <p className="text-gray-500">Create budgets to see your spending report.</p>
      </div>
    );
  }

  // Calculate overall stats
  const totalBudget = report.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = report.reduce((sum, item) => sum + item.actualSpending, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">₹{totalBudget.toLocaleString('en-IN')}</div>
          <div className="text-sm text-gray-600">Total Budget</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">₹{totalSpent.toLocaleString('en-IN')}</div>
          <div className="text-sm text-gray-600">Total Spent</div>
        </div>
        <div className="card p-4 text-center">
          <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{Math.abs(totalRemaining).toLocaleString('en-IN')}
          </div>
          <div className="text-sm text-gray-600">
            {totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Overall Spending</span>
          <span>{overallPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              overallPercentage > 100 ? 'bg-red-600' : 
              overallPercentage > 80 ? 'bg-yellow-500' : 'bg-green-600'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Category Breakdown</h3>
        <div className="space-y-4">
          {report.map((item) => {
            const percentage = item.percentageUsed;
            return (
              <div key={item._id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900">{item.category}</span>
                  <span className={`font-medium ${
                    item.status === 'exceeded' ? 'text-red-600' : 
                    item.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>₹{item.actualSpending.toLocaleString('en-IN')} / ₹{item.amount.toLocaleString('en-IN')}</span>
                  <span>₹{Math.abs(item.remaining).toLocaleString('en-IN')} {item.remaining >= 0 ? 'left' : 'over'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.status === 'exceeded' ? 'bg-red-600' : 
                      item.status === 'warning' ? 'bg-yellow-500' : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetReport;