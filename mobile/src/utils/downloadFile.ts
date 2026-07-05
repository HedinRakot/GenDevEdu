/**
 * F14: Datei-Download der Admin-Exporte.
 * - Web: authentifizierter Fetch (Bearer-Token via apiClient) → Blob → <a download>.
 *   Ein einfacher Anchor-Link würde das Token nicht mitschicken.
 * - Native: Base64 in den Cache schreiben und über das Share-Sheet anbieten
 *   (expo-file-system + expo-sharing, dynamisch importiert).
 */
import { Platform } from 'react-native';

import { apiClient } from '@/services/apiClient';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < bytes.length ? chars[b2 & 63] : '=';
  }
  return result;
}

export async function downloadFile(
  path: string,
  filename: string,
  mimeType: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    const response = await apiClient.get(path, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data as Blob);
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }

  const response = await apiClient.get(path, { responseType: 'arraybuffer' });
  const base64 = arrayBufferToBase64(response.data as ArrayBuffer);

  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');

  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: filename });
}
