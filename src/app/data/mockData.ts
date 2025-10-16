export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
};

export const products: Product[] = [
  { id: "1", sku: "SKU78901", name: "Smart Phone X", category: "Electronics", price: 699.99, stock: 150, status: "In Stock" },
  { id: "2", sku: "SKU12345", name: "Denim Jacket", category: "Apparel", price: 89.0, stock: 30, status: "Low Stock" },
  { id: "3", sku: "SKU67890", name: "Espresso Machine", category: "Home Goods", price: 249.99, stock: 0, status: "Out of Stock" },
  { id: "4", sku: "SKU23456", name: "Noise-Cancelling Headphones", category: "Electronics", price: 199.0, stock: 75, status: "In Stock" },
  { id: "5", sku: "SKU34567", name: "Hiking Backpack", category: "Outdoor Gear", price: 120.0, stock: 15, status: "Low Stock" }
];
