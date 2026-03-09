import { API_BASE_URL } from '../apiConfig';
import { bridge, isBridgeAvailable } from './bridge';

export type UploadNodeImageResponse = {
  url: string;
  relativePath: string;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('File read failed.'));
    reader.readAsDataURL(file);
  });

export const uploadNodeImage = async (file: File): Promise<UploadNodeImageResponse> => {
  const dataUrl = await readFileAsDataUrl(file);
  return bridge.uploadNodeImage({
    fileName: file.name,
    base64Data: dataUrl,
  });
};

export const resolveMediaUrl = (path: string | null | undefined): string | null => {
  if (!path) {
    return null;
  }

  if (/^(https?:)?\/\//i.test(path) || /^data:/i.test(path)) {
    return path;
  }

  if (isBridgeAvailable()) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `https://appmedia${normalizedPath}`;
  }

  const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};
