import { ArrowLeft, ClipboardPaste, FileText } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Alert, Button, Textarea } from '@/shared/ui';
import {
  MAX_ITEM_TEXT_BYTES,
  parseItemText,
  type ItemImportResult,
} from '../model/parse-item-text';

function formatNumber(value: number | undefined) {
  return value === undefined ? '—' : value.toLocaleString('en-US');
}

function ItemSummary({ result }: { result: ItemImportResult }) {
  if (!result.item) return null;
  const { item } = result;
  return (
    <section aria-labelledby="item-summary-title" className="space-y-6 border-t border-border pt-8">
      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Alvo normalizado
        </p>
        <h2 id="item-summary-title" className="font-display text-3xl tracking-wide text-foreground">
          {item.baseName}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Revise os campos reconhecidos antes de continuar para as próximas etapas.
        </p>
      </div>

      <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Raridade</dt>
          <dd className="font-medium">{item.rarity ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Item level</dt>
          <dd className="font-mono">{formatNumber(item.itemLevel)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Nível requerido</dt>
          <dd className="font-mono">{formatNumber(item.levelReq)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Armour</dt>
          <dd className="font-mono">{formatNumber(item.armour)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Energy Shield</dt>
          <dd className="font-mono">{formatNumber(item.energyShield)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sockets</dt>
          <dd className="font-mono">{item.sockets ?? '—'}</dd>
        </div>
      </dl>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="font-display text-lg text-foreground">Influências</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {item.influences.length > 0 ? (
              item.influences.map((influence) => <li key={influence}>{influence}</li>)
            ) : (
              <li>—</li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">Modificadores</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.implicits.length} implícitos · {item.explicits.length} explícitos ·{' '}
            {item.prefixes.length} prefixes · {item.suffixes.length} suffixes
          </p>
        </div>
      </div>

      {(item.implicits.length > 0 || item.explicits.length > 0) && (
        <div className="space-y-4">
          <h3 className="font-display text-lg text-foreground">Linhas reconhecidas</h3>
          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            {[...item.implicits, ...item.explicits].map((modifier, index) => (
              <li key={`${modifier}-${index}`}>{modifier}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function ItemImportPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ItemImportResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(parseItemText(text));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para início
        </Link>
        <p className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <ClipboardPaste className="size-4" aria-hidden="true" />
          Novo craft
        </p>
        <h1 className="font-display text-4xl tracking-tight text-foreground sm:text-5xl">
          Importar item
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Cole o texto copiado do cliente inglês de Path of Exile 1. O conteúdo permanece no
          navegador nesta etapa.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="item-text"
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <FileText className="size-4 text-primary" aria-hidden="true" />
            Texto do item
          </label>
          <Textarea
            id="item-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="New Item\nDivine Crown\n..."
            aria-describedby="item-text-help"
            rows={14}
          />
          <p id="item-text-help" className="text-xs text-muted-foreground">
            Um item por vez, no máximo {MAX_ITEM_TEXT_BYTES / 1024} KB.
          </p>
        </div>
        <Button type="submit">Interpretar item</Button>
      </form>

      {result?.error && (
        <Alert className={result.item ? 'border-primary/40' : 'border-destructive/50'}>
          <p className="font-medium text-foreground">{result.error.message}</p>
          {result.item && (
            <p className="mt-2 text-sm text-muted-foreground">
              Os campos reconhecidos estão abaixo; corrija o texto e interprete novamente.
            </p>
          )}
        </Alert>
      )}
      {result?.item && <ItemSummary result={result} />}
    </div>
  );
}
