/* c8 ignore file -- o fluxo real é validado pelo Storage Emulator. */
import {
  deleteObject,
  getStorage,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
  type UploadTask,
} from 'firebase/storage';
import { getFirebaseApp, getDefaultAuthGateway, type AuthGateway } from '@/features/identity';
import { MAX_SCREENSHOT_BYTES, validateScreenshot } from '../model/image-validation';

export interface ScreenshotUpload {
  storagePath: string;
  uploadId: string;
}

export interface ScreenshotStorageGateway {
  upload(file: File, onProgress?: (progress: number) => void): Promise<ScreenshotUpload>;
  remove(storagePath: string): Promise<void>;
}

function uploadTask(task: UploadTask, onProgress?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) =>
        onProgress?.(
          snapshot.totalBytes === 0 ? 0 : snapshot.bytesTransferred / snapshot.totalBytes,
        ),
      reject,
      resolve,
    );
  });
}

class FirebaseScreenshotStorageGateway implements ScreenshotStorageGateway {
  private readonly storage: FirebaseStorage;
  private readonly auth: AuthGateway;

  constructor(auth: AuthGateway) {
    this.auth = auth;
    this.storage = getStorage(getFirebaseApp());
  }

  async upload(file: File, onProgress?: (progress: number) => void) {
    const validationError = validateScreenshot(file);
    if (validationError) throw new Error(validationError.message);
    const user = this.auth.getCurrentUser();
    if (!user) throw new Error('A sessão ainda está inicializando. Tente novamente.');
    const uploadId = crypto.randomUUID();
    const storagePath = `screenshots/${user.uid}/${uploadId}`;
    const objectRef = ref(this.storage, storagePath);
    const task = uploadBytesResumable(objectRef, file, {
      contentType: file.type,
      customMetadata: {
        createdAt: new Date().toISOString(),
        size: String(file.size),
      },
    });
    await uploadTask(task, onProgress);
    return { storagePath, uploadId };
  }

  async remove(storagePath: string) {
    const user = this.auth.getCurrentUser();
    if (!user || !storagePath.startsWith(`screenshots/${user.uid}/`)) return;
    await deleteObject(ref(this.storage, storagePath));
  }
}

export function createScreenshotStorageGateway(auth: AuthGateway = getDefaultAuthGateway()) {
  return new FirebaseScreenshotStorageGateway(auth);
}

export const SCREENSHOT_UPLOAD_LIMIT = MAX_SCREENSHOT_BYTES;
