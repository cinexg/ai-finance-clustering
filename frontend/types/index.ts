export interface Transaction {
  transaction_id: string;
  date: string | null;
  vendor: string | null;
  amount: number | null;
  cluster_id: number;
  cluster_name: string;
  manual_category: string | null;
}

export interface ClusterSummary {
  cluster_name: string;
  total: number;
  count: number;
}

export interface TransactionCreate {
  date: string;
  vendor: string;
  amount: number;
  manual_category?: string | null;
}

export interface TransactionUpdate {
  date?: string;
  vendor?: string;
  amount?: number;
  manual_category?: string | null;
}
