import api from './authService';

// Get all budgets for the user
export const getBudgets = async () => {
  try {
    const response = await api.get('/budgets');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch budgets');
  }
};

// Create a new budget
export const createBudget = async (budgetData) => {
  try {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create budget');
  }
};

// Update a budget
export const updateBudget = async (id, budgetData) => {
  try {
    const response = await api.put(`/budgets/${id}`, budgetData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update budget');
  }
};

// Delete a budget
export const deleteBudget = async (id) => {
  try {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete budget');
  }
};

// Get budget report
export const getBudgetReport = async () => {
  try {
    const response = await api.get('/budgets/report/summary');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch budget report');
  }
};