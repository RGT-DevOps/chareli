export interface UploadResult {
  key: string;
  publicUrl: string;
}

export interface ProgressCallback {
  (current: number, total: number): void;
}

export interface IStorageService {
  uploadFile(
    file: Buffer,
    originalname: string,
    contentType: string,
    folder?: string
  ): Promise<UploadResult>;

  generatePresignedUrl(key: string, contentType: string): Promise<string>;
  downloadFile(key: string): Promise<Buffer>;
  uploadDirectory(
    localPath: string, 
    remotePath: string,
    onProgress?: ProgressCallback
  ): Promise<void>;
  deleteFile(key: string): Promise<boolean>;
  moveFile(sourceKey: string, destinationKey: string): Promise<string>;
  getPublicUrl(key: string): string;
}
