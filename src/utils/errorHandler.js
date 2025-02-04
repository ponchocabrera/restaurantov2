export const handleApiError = (error, fallbackMessage = 'An error occurred') => {
  console.error(error);
  const message = error.response?.data?.message || error.message || fallbackMessage;
  return { error: true, message };
}; 