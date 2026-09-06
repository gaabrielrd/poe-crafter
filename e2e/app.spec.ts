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
  await expect(page.getByRole('alert')).toContainText('Alvo confirmado');
});
