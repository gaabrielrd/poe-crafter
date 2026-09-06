import { Camera, Upload } from 'lucide-react';
import { useState, type ChangeEvent, type DragEvent } from 'react';
import { Alert, Button, Input } from '@/shared/ui';
import { submitScreenshot } from '../services/screenshot-ocr';
import { MAX_SCREENSHOT_BYTES, validateScreenshot } from '../model/image-validation';

type ImportState = 'idle' | 'uploading' | 'success' | 'error';

export function ScreenshotImporter({
  disabled = false,
  onText,
}: {
  disabled?: boolean;
  onText: (text: string) => void;
}) {
  const [state, setState] = useState<ImportState>('idle');
  const [message, setMessage] = useState('');

  async function processFile(file: File | undefined) {
    if (!file || disabled) return;
    const validationError = validateScreenshot(file);
    if (validationError) {
      setState('error');
      setMessage(validationError.message);
      return;
    }
    setState('uploading');
    setMessage('Enviando imagem para OCR…');
    try {
      const result = await submitScreenshot(file);
      onText(result.text);
      setState('success');
      setMessage('Texto extraído. Revise o alvo abaixo antes de confirmar.');
    } catch (error: unknown) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Não foi possível processar a imagem.');
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    void processFile(event.target.files?.[0]);
    event.target.value = '';
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void processFile(event.dataTransfer.files[0]);
  }

  return (
    <section
      aria-labelledby="screenshot-import-title"
      className="space-y-4 border-y border-border/80 py-6"
    >
      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Outra fonte
        </p>
        <h2
          id="screenshot-import-title"
          className="font-display text-2xl tracking-wide text-foreground"
        >
          Importar screenshot
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Envie uma imagem do item em inglês para extrair o texto automaticamente.
        </p>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="space-y-4 rounded-lg border border-dashed border-border p-5"
      >
        <label htmlFor="screenshot-file" className="text-sm font-medium text-foreground">
          Imagem do item
        </label>
        <Input
          id="screenshot-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onInputChange}
          disabled={disabled || state === 'uploading'}
          aria-describedby="screenshot-file-help"
        />
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || state === 'uploading'}
            onClick={() => document.getElementById('screenshot-file')?.click()}
          >
            <Upload className="icon icon-sm" aria-hidden="true" />
            Escolher imagem
          </Button>
          <p
            id="screenshot-file-help"
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Camera className="icon icon-sm" aria-hidden="true" /> PNG, JPEG ou WebP · até{' '}
            {MAX_SCREENSHOT_BYTES / 1024 / 1024} MB
          </p>
        </div>
      </div>

      {state === 'uploading' && (
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      {state === 'success' && <Alert className="border-primary/40">{message}</Alert>}
      {state === 'error' && (
        <Alert role="alert" className="border-destructive/50">
          {message}
        </Alert>
      )}
    </section>
  );
}
