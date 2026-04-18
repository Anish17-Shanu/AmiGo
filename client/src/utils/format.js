export const currency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount || 0);

export const shortDate = (date) => new Date(date).toLocaleDateString();
