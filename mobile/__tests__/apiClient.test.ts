import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as authEvents from '@/services/authEvents';
import { setApiTokenProvider, apiClient } from '@/services/apiClient';

beforeEach(() => {
  // Reset token provider so tests don't bleed into each other.
  setApiTokenProvider(async () => null);
  jest.clearAllMocks();
});

type Adapter = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

function makeUnauthorized(config: InternalAxiosRequestConfig): AxiosError {
  const response = {
    data: 'Unauthorized',
    status: 401,
    statusText: 'Unauthorized',
    config,
    headers: {},
  } as AxiosResponse;
  const error = new Error('Request failed with status code 401') as AxiosError;
  error.config = config;
  error.response = response;
  error.isAxiosError = true;
  return error;
}

describe('apiClient request-interceptor', () => {
  it('attaches the Bearer token from the registered provider', async () => {
    setApiTokenProvider(async () => 'access-xyz');
    const calls: InternalAxiosRequestConfig[] = [];
    const adapter: Adapter = async (config) => {
      calls.push(config);
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
    };

    const response = await apiClient.request({ url: '/courses', adapter });
    expect(response.status).toBe(200);
    expect((calls[0].headers as Record<string, string>).Authorization).toBe('Bearer access-xyz');
  });

  it('omits the Authorization header when the provider returns null', async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const adapter: Adapter = async (config) => {
      calls.push(config);
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
    };

    const response = await apiClient.request({ url: '/courses', adapter });
    expect(response.status).toBe(200);
    expect((calls[0].headers as Record<string, string>).Authorization).toBeUndefined();
  });
});

describe('apiClient response-interceptor', () => {
  it('emits a force-logout event on 401 (Clerk handles token refresh automatically)', async () => {
    const emitSpy = jest.spyOn(authEvents, 'emitForceLogout');
    const adapter: Adapter = async (config) => {
      throw makeUnauthorized(config);
    };

    await expect(apiClient.request({ url: '/courses', adapter })).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });
});
