export enum TaskStatus {
  TO_CHECK = 'TO_CHECK',
  CHECK_COMPLETED = 'CHECK_COMPLETED',
  DEPOSIT_PAID = 'DEPOSIT_PAID',
  GAS_OPENED = 'GAS_OPENED',
  SERVICE_DIRECTED = 'SERVICE_DIRECTED'
}

export interface Task {
  id: string;
  orderNumber: number; // Sıra Numarası
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: string; // İşi Yapan Usta
  
  // Customer Details (Kişi Bilgileri)
  date?: string;
  address?: string;
  phone?: string;
  generalNote?: string; // Kişi Bilgileri içindeki not

  // Check Info (Kontrol Elemanı Bilgileri)
  teamNote?: string; // Kontrol Ekibi Notu
  isCheckVerified?: boolean; // Kontrolü Yapıldı Onayı

  // Gas Opening Info (Gaz Açım Bilgileri)
  gasOpeningDate?: string;
  gasNote?: string;

  // Service Info (Servis Bilgileri)
  serviceSerialNumber?: string;
  serviceNote?: string;
}

export interface AudioConfig {
  sampleRate: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isSpeaking: boolean;
  error: string | null;
}

// Helper for type-safe keys
export const StatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TO_CHECK]: 'Kontrolü Yapılacak İşler',
  [TaskStatus.CHECK_COMPLETED]: 'Kontrolü Yapılan İşler',
  [TaskStatus.DEPOSIT_PAID]: 'Depozito Yatırıldı',
  [TaskStatus.GAS_OPENED]: 'Gaz Açıldı',
  [TaskStatus.SERVICE_DIRECTED]: 'Servis Yönlendirildi'
};