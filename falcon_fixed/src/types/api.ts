export interface UserDTO {
  id?: number;
  fullName: string;
  phoneNumber: string;
  languagePreference: string;
  isVerified: boolean;
  createdAt?: string;
}

export interface TransactionDTO {
  id?: number;
  userId: number;
  amount: number;
  transactionType: 'TRANSFER' | 'WITHDRAWAL' | 'DEPOSIT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  timestamp?: string;
}
