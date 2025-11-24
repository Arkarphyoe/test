export const DEFAULT_COA = [
  { code: '5000', label: 'Cost of Goods Sold', type: 'expense' },
  { code: '6000', label: 'Rent & Lease', type: 'expense' },
  { code: '6100', label: 'Utilities', type: 'expense' },
  { code: '6200', label: 'Salaries', type: 'expense' },
  { code: '6300', label: 'Office Supplies', type: 'expense' },
  { code: '6800', label: 'Other Expenses', type: 'expense' },
  { code: '1010', label: 'Cash on Hand', type: 'payment' },
  { code: '1020', label: 'Business Bank (KBZ/AYA)', type: 'payment' },
];

export const DEFAULT_PRICELISTS = [
  { name: 'Standard Retail', multiplier: 1.0 },
  { name: 'Wholesale', multiplier: 0.9 },
  { name: 'Corporate', multiplier: 0.95 }
];

export const DEFAULT_INVENTORY = [
  { name: 'Dell XPS 13 Plus', type: 'Storable', cost: 4000000, price: 4500000, stock: 5, category: 'Laptop' },
  { name: 'MacBook Air M2', type: 'Storable', cost: 3500000, price: 3800000, stock: 8, category: 'Laptop' },
  { name: 'Lenovo ThinkPad X1', type: 'Storable', cost: 3900000, price: 4200000, stock: 3, category: 'Laptop' },
  { name: 'Acer Swift Go', type: 'Storable', cost: 1800000, price: 2100000, stock: 12, category: 'Laptop' },
  { name: 'Software Implementation Service', type: 'Service', cost: 0, price: 500000, stock: 0, category: 'Service' },
  { name: 'Windows 11 License & Install', type: 'Service', cost: 50000, price: 80000, stock: 0, category: 'Service' },
  { name: 'Annual Maintenance Contract', type: 'Service', cost: 0, price: 1200000, stock: 0, category: 'Service' }
];

export const DEFAULT_PARTNERS = [
  { name: 'Golden Land Co.', phone: '09-12345678', type: 'Customer' },
  { name: 'Myanmar IT Solutions', phone: '09-87654321', type: 'Customer' },
  { name: 'Yangon Supplies Ltd.', phone: '01-234567', type: 'Vendor' },
  { name: 'Tech World Distribution', phone: '09-11223344', type: 'Vendor' }
];