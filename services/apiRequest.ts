export const API_ERROR = Symbol('api_error');

export async function apiRequest<T>(call: Promise<{ data: T }>): Promise<T | typeof API_ERROR> {
  try {
    const res = await call;
    return res.data;
  } catch (error: any) {
    if (error._handled) return API_ERROR;
    throw error;
  }
}
