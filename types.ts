export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  [key: string]: any;
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
  type: 'Customer' | 'Vendor';
}

export interface ChartOfAccount {
  id: string;
  code: string;
  label: string;
  type: 'expense' | 'payment';
}

export interface PriceList {
  id: string;
  name: string;
  multiplier: number | string;
  label?: string;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  price: number;
}

export interface Sale {
  id: string;
  customer: { name: string };
  total: number;
  timestamp: any;
  items: any[];
  paymentType?: string;
  paymentAccount?: string;
}

export interface Purchase {
  id: string;
  vendor: string;
  total: number;
  date: string;
  items: any[];
  timestamp: any;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  timestamp: any;
  [key: string]: any;
}

export interface StockMove {
  id: string;
  productName: string;
  qty: number;
  locationId: string;
  locationDestId: string;
  reference: string;
  timestamp: any;
}

export interface Stats {
  totalSales: number;
  totalExpenses: number;
  lowStockCount: number;
  inventoryValue: number;
  netProfit: number;
}