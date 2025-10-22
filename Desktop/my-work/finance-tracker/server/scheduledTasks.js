const cron = require('node-cron');
const { processRecurringTransactions } = require('./controllers/transactionController');

// Schedule recurring transaction processing
// Runs every day at midnight
const scheduleRecurringTransactions = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Processing recurring transactions...');
    try {
      await processRecurringTransactions();
      console.log('Recurring transactions processed successfully');
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
    }
  });
};

module.exports = { scheduleRecurringTransactions };