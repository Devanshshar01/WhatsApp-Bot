import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TransactionChart = ({ transactions }) => {
  // Group transactions by month
  const groupTransactionsByMonth = () => {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthYear].income += transaction.amount;
      } else {
        monthlyData[monthYear].expenses += transaction.amount;
      }
    });
    
    return monthlyData;
  };
  
  // Prepare data for the chart
  const prepareChartData = () => {
    const monthlyData = groupTransactionsByMonth();
    const labels = Object.keys(monthlyData);
    const incomeData = labels.map(label => monthlyData[label].income);
    const expenseData = labels.map(label => monthlyData[label].expenses);
    
    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald green
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.7,
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: 'rgba(244, 63, 94, 0.8)', // Rose red
          borderColor: 'rgb(244, 63, 94)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.7,
        }
      ]
    };
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
            family: "'Poppins', sans-serif",
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: 'Income vs Expenses Over Time (₹) 📊',
        font: {
          size: 20,
          family: "'Poppins', sans-serif",
          weight: 'bold'
        },
        padding: {
          top: 20,
          bottom: 30
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 15,
        titleFont: {
          size: 16,
          family: "'Poppins', sans-serif",
          weight: 'bold'
        },
        bodyFont: {
          size: 14,
          family: "'Poppins', sans-serif"
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
              }).format(context.parsed.y);
            }
            return label;
          }
        },
        displayColors: true,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif",
            weight: 'bold'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif",
            weight: 'bold'
          },
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    }
  };
  
  const chartData = prepareChartData();
  
  return (
    <div className="card p-6 fade-in">
      <div style={{ height: '450px' }}>
        {transactions.length > 0 ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-6 mb-6">
              <div className="text-6xl mb-4">📊</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No data available</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Add some transactions (₹) to see your income and expenses visualized over time with this beautiful chart!
            </p>
            <div className="inline-flex items-center text-indigo-600 font-bold">
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tip: Track at least 3 months for better insights!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionChart;