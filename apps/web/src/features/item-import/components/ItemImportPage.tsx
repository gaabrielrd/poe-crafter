import { ArrowLeft, ClipboardPaste, FileText } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import type { ItemInfluence, NormalizedItemTarget } from '@poe-crafter/shared-types';
import { Alert, Button, Input, Select, Textarea } from '@/shared/ui';
import {
  confirmItemDraft,
  createItemDraft,
  MODIFIER_CLASSIFICATIONS,
  type ConfirmationIssue,
  type EditableItemFields,
  type ItemDraft,
  type ModifierClassification,
  type ModifierSource,
} from '../model/confirm-item';
import {
  MAX_ITEM_TEXT_BYTES,
  parseItemText,
  type ItemImportResult,
} from '../model/parse-item-text';

function formatNumber(value: number | undefined) {
  return value === undefined ? '—' : value.toLocaleString('en-US');
}

function sourceLabel(source: ModifierSource) {
  return {
    implicit: 'Implícito',
    explicit: 'Explícito',
    prefix: 'Prefix',
    suffix: 'Suffix',
  }[source];
}

function ItemSummary({ item }: { item: NormalizedItemTarget }) {
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
          Revise os campos reconhecidos e classifique os modificadores antes de continuar.
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

function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  error,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function issueFor(issues: ConfirmationIssue[], field: string) {
  return issues.find((issue) => issue.field === field)?.message;
}

function ConfirmationForm({
  draft,
  issues,
  onChange,
  onConfirm,
}: {
  draft: ItemDraft;
  issues: ConfirmationIssue[];
  onChange: (draft: ItemDraft) => void;
  onConfirm: () => void;
}) {
  const updateField = <K extends keyof EditableItemFields>(
    field: K,
    value: EditableItemFields[K],
  ) => {
    onChange({ ...draft, fields: { ...draft.fields, [field]: value } });
  };

  const updateModifier = (
    id: string,
    update: { text?: string; classification?: ModifierClassification | '' },
  ) => {
    onChange({
      ...draft,
      modifiers: draft.modifiers.map((modifier) =>
        modifier.id === id ? { ...modifier, ...update } : modifier,
      ),
    });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm();
      }}
      className="space-y-10 border-t border-border pt-8"
    >
      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Confirmação do alvo
        </p>
        <h2 className="font-display text-3xl tracking-wide text-foreground">
          Revise antes de planejar
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Corrija os campos reconhecidos e escolha a importância de cada modificador. Nenhuma
          escolha é aplicada automaticamente.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Nome da base"
          id="base-name"
          value={draft.fields.baseName}
          onChange={(value) => updateField('baseName', value)}
          error={issueFor(issues, 'baseName')}
        />
        <Field
          label="Item level"
          id="item-level"
          value={draft.fields.itemLevel}
          onChange={(value) => updateField('itemLevel', value)}
          type="number"
          error={issueFor(issues, 'itemLevel')}
        />
        <Field
          label="Raridade"
          id="rarity"
          value={draft.fields.rarity}
          onChange={(value) => updateField('rarity', value)}
        />
        <Field
          label="Armour"
          id="armour"
          value={draft.fields.armour}
          onChange={(value) => updateField('armour', value)}
          type="number"
          error={issueFor(issues, 'armour')}
        />
        <Field
          label="Percentil base de Armour"
          id="armour-base-percentile"
          value={draft.fields.armourBasePercentile}
          onChange={(value) => updateField('armourBasePercentile', value)}
          type="number"
          error={issueFor(issues, 'armourBasePercentile')}
        />
        <Field
          label="Energy Shield"
          id="energy-shield"
          value={draft.fields.energyShield}
          onChange={(value) => updateField('energyShield', value)}
          type="number"
          error={issueFor(issues, 'energyShield')}
        />
        <Field
          label="Percentil base de Energy Shield"
          id="energy-shield-base-percentile"
          value={draft.fields.energyShieldBasePercentile}
          onChange={(value) => updateField('energyShieldBasePercentile', value)}
          type="number"
          error={issueFor(issues, 'energyShieldBasePercentile')}
        />
        <Field
          label="Nível requerido"
          id="level-req"
          value={draft.fields.levelReq}
          onChange={(value) => updateField('levelReq', value)}
          type="number"
          error={issueFor(issues, 'levelReq')}
        />
        <Field
          label="Qualidade"
          id="quality"
          value={draft.fields.quality}
          onChange={(value) => updateField('quality', value)}
          type="number"
          error={issueFor(issues, 'quality')}
        />
        <Field
          label="Qualidade de catalyst"
          id="catalyst-quality"
          value={draft.fields.catalystQuality}
          onChange={(value) => updateField('catalystQuality', value)}
          type="number"
          error={issueFor(issues, 'catalystQuality')}
        />
        <Field
          label="Sockets"
          id="sockets"
          value={draft.fields.sockets}
          onChange={(value) => updateField('sockets', value)}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="font-display text-lg text-foreground">Propriedades especiais</legend>
        <label className="flex items-center gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={draft.fields.crafted}
            onChange={(event) => updateField('crafted', event.target.checked)}
            className="size-4 accent-primary"
          />
          Item crafted
        </label>
        <div className="flex flex-wrap gap-5">
          {(['searing-exarch', 'eater-of-worlds'] as const).map((influence: ItemInfluence) => (
            <label key={influence} className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={draft.fields.influences.includes(influence)}
                onChange={(event) => {
                  const influences = event.target.checked
                    ? [...draft.fields.influences, influence]
                    : draft.fields.influences.filter((value) => value !== influence);
                  updateField('influences', influences);
                }}
                className="size-4 accent-primary"
              />
              {influence}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-lg text-foreground">
          Classificação dos modificadores
        </legend>
        <p className="text-sm leading-6 text-muted-foreground">
          Required entra nas restrições do alvo, Optional fica disponível para comparação e Ignore
          não será considerado. Todos precisam de uma escolha.
        </p>
        {draft.modifiers.length > 0 ? (
          <div className="space-y-4">
            {draft.modifiers.map((modifier) => {
              const error = issueFor(issues, `modifier-${modifier.id}`);
              return (
                <div
                  key={modifier.id}
                  className="grid gap-3 border-b border-border pb-4 sm:grid-cols-[1fr_12rem] sm:items-end"
                >
                  <div className="space-y-2">
                    <label
                      htmlFor={`${modifier.id}-text`}
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {sourceLabel(modifier.source)} {modifier.index + 1}
                    </label>
                    <Input
                      id={`${modifier.id}-text`}
                      value={modifier.text}
                      onChange={(event) =>
                        updateModifier(modifier.id, { text: event.target.value })
                      }
                      aria-invalid={Boolean(error)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor={`${modifier.id}-classification`}
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Classificação
                    </label>
                    <Select
                      id={`${modifier.id}-classification`}
                      value={modifier.classification}
                      onChange={(event) =>
                        updateModifier(modifier.id, {
                          classification: event.target.value as ModifierClassification | '',
                        })
                      }
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? `${modifier.id}-error` : undefined}
                    >
                      <option value="">Escolha uma opção</option>
                      {MODIFIER_CLASSIFICATIONS.map((classification) => (
                        <option key={classification} value={classification}>
                          {classification.charAt(0).toUpperCase() + classification.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {error && (
                    <p
                      id={`${modifier.id}-error`}
                      className="text-sm text-destructive sm:col-span-2"
                    >
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum modificador foi reconhecido.</p>
        )}
      </fieldset>

      {draft.source.unparsedLines.length > 0 && (
        <Alert className="border-destructive/50">
          <p className="font-medium text-foreground">Existem linhas não reconhecidas</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {draft.source.unparsedLines.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            Reimporte o texto corrigido antes de confirmar o alvo.
          </p>
        </Alert>
      )}

      {issues.length > 0 && (
        <Alert role="alert" className="border-destructive/50">
          <p className="font-medium text-foreground">
            Corrija os campos indicados para confirmar o alvo.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{issues[0]?.message}</p>
        </Alert>
      )}

      <Button type="submit">Confirmar alvo</Button>
    </form>
  );
}

export function ItemImportPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ItemImportResult | null>(null);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [issues, setIssues] = useState<ConfirmationIssue[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextResult = parseItemText(text);
    setResult(nextResult);
    setIssues([]);
    setConfirmed(false);
    setDraft(nextResult.item ? createItemDraft(nextResult.item) : null);
  }

  function handleConfirm() {
    if (!draft) return;
    const next = confirmItemDraft(draft);
    if ('issues' in next) {
      setIssues(next.issues);
      setConfirmed(false);
      return;
    }
    setIssues([]);
    setConfirmed(true);
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
              Os campos reconhecidos estão abaixo; corrija os campos e confirme o alvo.
            </p>
          )}
        </Alert>
      )}
      {result?.item && <ItemSummary item={result.item} />}
      {draft && (
        <ConfirmationForm
          draft={draft}
          issues={issues}
          onChange={setDraft}
          onConfirm={handleConfirm}
        />
      )}
      {confirmed && (
        <Alert className="border-primary/40">
          <p className="font-medium text-foreground">Alvo confirmado.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            O item está pronto para a validação de craftabilidade na próxima etapa.
          </p>
        </Alert>
      )}
    </div>
  );
}
