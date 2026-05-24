import type { Customer } from "@/types";

export const mockCustomers: Customer[] = [
  { id: "c1", name: "Sarah Mills", email: "sarah@example.com", phone: "+44 7700 900111", orders: 14, totalSpent: 248.5, lastOrder: "2 min ago" },
  { id: "c2", name: "James Okafor", email: "james@example.com", phone: "+44 7700 900222", orders: 8, totalSpent: 184.2, lastOrder: "12 min ago" },
  { id: "c3", name: "Priya Shah", email: "priya@example.com", phone: "+44 7700 900333", orders: 22, totalSpent: 402.1, lastOrder: "25 min ago" },
  { id: "c4", name: "Tom Wright", email: "tom@example.com", phone: "+44 7700 900444", orders: 3, totalSpent: 76, lastOrder: "1 hr ago" },
  { id: "c5", name: "Aisha Khan", email: "aisha@example.com", phone: "+44 7700 900555", orders: 11, totalSpent: 198.6, lastOrder: "Yesterday" },
];