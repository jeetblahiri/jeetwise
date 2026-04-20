const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

export function formatTimestamp(value) {
  if (!value) {
    return 'Just now';
  }

  if (typeof value.toDate === 'function') {
    return dateFormatter.format(value.toDate());
  }

  return dateFormatter.format(new Date(value));
}
