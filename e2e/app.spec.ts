import { expect, test } from '@playwright/test';

test('executa o fluxo principal e preserva a rota de fallback', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Uma bancada confiável para planejar cada craft.' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Comandos pnpm disponíveis' })).toBeVisible();
  await expect(page.getByText('pnpm validate')).toBeVisible();

  await page.goto('/rota-que-nao-existe');
  await expect(page.getByRole('heading', { name: /página não encontrada/i })).toBeVisible();
});

test('mantém navegação e conteúdo utilizáveis em 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
  await expect(page.getByText('pnpm validate')).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Página inicial' })).toBeFocused();
});

test('inicia sessão anônima e vincula somente Google preservando o UID', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Sessão anônima')).toBeVisible();
  await page.getByRole('button', { name: 'Vincular Google' }).click();
  await expect(page.getByText('Google conectado')).toBeVisible();
  await expect(page.getByText('fixture@example.com')).toBeVisible();
  await expect(page.getByText('Sessão anônima')).not.toBeVisible();
});

test('solicita exclusão somente após vínculo Google e confirmação explícita', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByText('Vincule sua conta Google primeiro')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Solicitar exclusão' })).not.toBeVisible();

  await page.goto('/');
  await page.getByRole('button', { name: 'Vincular Google' }).click();
  await page.getByRole('link', { name: 'Configurações' }).click();
  await expect(page.getByRole('heading', { name: 'Identidade Google' })).toBeVisible();
  await page.getByRole('button', { name: 'Solicitar exclusão' }).click();
  await page.getByLabel('Confirmação').fill('EXCLUIR');
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click();

  await expect(page.getByText('Exclusão agendada')).toBeVisible();
  await expect(
    page.getByText(/não afirma que a conta ou os dados já foram apagados/i),
  ).toBeVisible();
});

test('não expõe diagnóstico operacional para uma sessão sem permissão', async ({ page }) => {
  await page.route('**/admin/overview', (route) =>
    route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'admin-forbidden', message: 'Acesso não autorizado.' }),
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Vincular Google' }).click();
  await page.getByRole('link', { name: 'Administração' }).click();

  await expect(page.getByText('Sem permissão')).toBeVisible();
  await expect(page.getByText(/Diagnóstico agregado de dados, preços e jobs/)).toBeVisible();
  await expect(page.getByText('Standard')).not.toBeVisible();
});

test('importa texto de item e mostra a confirmação normalizada', async ({ page }) => {
  await page.route('**/leagues', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        fetchedAt: '2026-09-05T12:00:00.000Z',
        leagues: [{ id: 'standard', name: 'Standard', platform: 'pc' }],
      }),
    }),
  );
  await page.goto('/new');
  await page.getByLabel('Liga PC ativa').selectOption('standard');
  await page
    .getByRole('textbox', { name: 'Texto do item' })
    .fill('New Item\nDivine Crown\nItemLevel: 86\nLevelReq: 84\nPrefix: IncreasedLife9');
  await page.getByRole('button', { name: 'Interpretar item' }).click();
  await expect(page.getByRole('heading', { name: 'Divine Crown' })).toBeVisible();
  await expect(page.getByText('86', { exact: true })).toBeVisible();
  await page.getByLabel('Classificação').selectOption('required');
  await page.getByRole('button', { name: 'Confirmar alvo' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Alvo confirmado' })).toBeVisible();
  await page.getByRole('button', { name: 'Validar craftabilidade' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Alvo aceito pelas regras suportadas' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Preparar pedido' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Pedido preparado' })).toBeVisible();
  await page.getByRole('button', { name: 'Gerar estratégias' }).click();
  await expect(page.getByText('Estratégias prontas').last()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bancada de vida' })).toBeVisible();
  await page.getByText('Ver explicação dos passos').first().click();
  await expect(page.getByText('Base inicial').first()).toBeVisible();
  await expect(page.getByText(/Estado esperado:/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar execução local' }).first().click();
  await page.getByLabel('Recurso gasto (opcional)').first().fill('Orb');
  await page.getByLabel('Chaos gasto (opcional)').first().fill('2');
  await page.getByRole('button', { name: 'Registrar retry' }).first().click();
  await page.getByRole('button', { name: 'Registrar sucesso' }).first().click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Craft concluído' }).first(),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Resumo do craft' }).first()).toBeVisible();
  await expect(page.getByText('Custo real').first()).toBeVisible();
  await expect(page.getByText('2.0 chaos').first()).toBeVisible();
  await page.getByRole('button', { name: 'Recalcular estratégia' }).click();
  await expect(page.getByText('Nova versão pronta')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar versão anterior' }).click();
  await expect(page.getByLabel('Versão ativa')).toHaveValue(/plan-version-1-/);
});

test('percorre o fluxo crítico por teclado em 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/leagues', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        fetchedAt: '2026-09-06T00:00:00.000Z',
        leagues: [{ id: 'standard', name: 'Standard', platform: 'pc' }],
      }),
    }),
  );
  await page.goto('/new');

  const league = page.getByLabel('Liga PC ativa');
  await league.focus();
  await expect(league).toBeFocused();
  expect(await league.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  await league.press('ArrowDown');
  await league.press('Enter');

  const itemText = page.getByRole('textbox', { name: 'Texto do item' });
  await itemText.focus();
  await expect(itemText).toBeFocused();
  await itemText.fill('New Item\nDivine Crown\nItemLevel: 86\nPrefix: IncreasedLife9');

  const interpret = page.getByRole('button', { name: 'Interpretar item' });
  await interpret.focus();
  await expect(interpret).toBeFocused();
  await interpret.press('Enter');
  await expect(page.getByRole('heading', { name: 'Divine Crown' })).toBeVisible();

  const classification = page.getByLabel('Classificação');
  await classification.focus();
  await expect(classification).toBeFocused();
  await classification.press('ArrowDown');
  await classification.press('Enter');

  const confirm = page.getByRole('button', { name: 'Confirmar alvo' });
  await confirm.focus();
  await expect(confirm).toBeFocused();
  await confirm.press('Enter');
  await expect(page.getByRole('alert').filter({ hasText: 'Alvo confirmado' })).toBeVisible();

  const validate = page.getByRole('button', { name: 'Validar craftabilidade' });
  await validate.focus();
  await expect(validate).toBeFocused();
  await validate.press('Enter');
  await expect(
    page.getByRole('status').filter({ hasText: 'Alvo aceito pelas regras suportadas' }),
  ).toBeVisible();

  const prepare = page.getByRole('button', { name: 'Preparar pedido' });
  await prepare.focus();
  await expect(prepare).toBeFocused();
  await prepare.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Pedido preparado' })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('importa screenshot e encaminha o texto extraído ao parser', async ({ page }) => {
  await page.route('**/leagues', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        fetchedAt: '2026-09-06T00:00:00.000Z',
        leagues: [{ id: 'standard', name: 'Standard', platform: 'pc' }],
      }),
    }),
  );
  await page.route('**/screenshot-ocr', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        text: 'New Item\nDivine Crown\nItemLevel: 86\nLevelReq: 84\nPrefix: IncreasedLife9',
        processedAt: '2026-09-06T00:00:00.000Z',
      }),
    }),
  );
  await page.goto('/new');
  await page.getByLabel('Liga PC ativa').selectOption('standard');
  await page.getByLabel('Imagem do item').setInputFiles({
    name: 'item.png',
    mimeType: 'image/png',
    buffer: Buffer.from('fixture'),
  });
  await expect(page.getByRole('heading', { name: 'Divine Crown' })).toBeVisible();
  await expect(
    page.getByText('Texto extraído. Revise o alvo abaixo antes de confirmar.'),
  ).toBeVisible();
});

test('salva, lista e retoma um craft no histórico privado fixture', async ({ page }) => {
  await page.route('**/leagues', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        fetchedAt: '2026-09-06T00:00:00.000Z',
        leagues: [{ id: 'standard', name: 'Standard', platform: 'pc' }],
      }),
    }),
  );
  await page.goto('/new');
  await page.getByLabel('Liga PC ativa').selectOption('standard');
  await page
    .getByRole('textbox', { name: 'Texto do item' })
    .fill('New Item\nDivine Crown\nItemLevel: 86\nPrefix: IncreasedLife9');
  await page.getByRole('button', { name: 'Interpretar item' }).click();
  await page.getByLabel('Classificação').selectOption('required');
  await page.getByRole('button', { name: 'Confirmar alvo' }).click();
  await page.getByRole('button', { name: 'Salvar craft' }).click();
  await expect(page.getByText('Craft salvo no histórico privado.')).toBeVisible();
  await page.getByRole('link', { name: 'Abrir craft salvo' }).click();
  await expect(page.getByRole('heading', { name: 'Divine Crown' })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar para início' }).click();
  await page.getByRole('button', { name: 'Vincular Google' }).click();
  await expect(page.getByText('Google conectado')).toBeVisible();
  await page.getByRole('link', { name: 'Histórico' }).click();
  await expect(page.getByRole('link', { name: /Divine Crown/ })).toBeVisible();
});
