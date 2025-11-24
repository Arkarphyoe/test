export const formatMMK = (amount: number | string | undefined) => {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  return 'Ks ' + (val || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};