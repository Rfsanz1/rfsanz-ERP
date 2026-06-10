type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
};

export const handleApiError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.status === 401) {
    return 'Sesi Anda telah kadaluarsa. Silakan login ulang.';
  }
  if (error?.response?.status === 403) {
    return 'Anda tidak memiliki akses untuk melakukan aksi ini.';
  }
  if (error?.response?.status === 404) {
    return 'Data tidak ditemukan.';
  }
  if (error?.response?.status === 422) {
    const errors = error.response.data?.errors;
    if (errors) {
      return Object.values(errors)
        .flat()
        .join(', ');
    }
    return 'Data tidak valid. Silakan periksa kembali.';
  }
  if (error?.response?.status >= 500) {
    return 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
  }
  if (error?.message === 'Network Error') {
    return 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
  }
  return error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
};

export const createSuccessResponse = <T,>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
});

export const createErrorResponse = (message: string, errors?: Record<string, string[]>): ApiResponse => ({
  success: false,
  message,
  errors,
  timestamp: new Date().toISOString(),
});
