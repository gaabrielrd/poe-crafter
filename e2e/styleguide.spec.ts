import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Rede de proteção da identidade visual, em duas camadas:
 *
 * 1. contrato de estilo — compara valores computados (tokens e cores de
 *    componentes). É determinístico em qualquer sistema operacional e diz
 *    exatamente o que mudou;
 * 2. aparência — compara a página inteira pixel a pixel. Pega regressões de
 *    layout que o contrato não vê, mas depende das fontes do sistema, então
 *    cada plataforma tem sua própria imagem de referência.
 */

const screenshotName = 'styleguide.png';
const baseline = join('e2e', '__screenshots__', process.platform, screenshotName);

test('mantém o contrato de estilo do tema', async ({ page }) => {
  await page.goto('/styleguide');

  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'poe-crafter');
  await expect(root).toHaveCSS('--primary', '#c9a45d');
  await expect(root).toHaveCSS('--destructive', '#b95757');
  await expect(root).toHaveCSS('--success', '#66b795');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 17, 22)');
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(244, 239, 227)');

  // Os componentes precisam consumir os tokens, não apenas declará-los.
  await expect(page.getByRole('button', { name: 'Ação primária' })).toHaveCSS(
    'background-color',
    'rgb(201, 164, 93)',
  );

  // Fontes oficiais: título em TheMix, texto em Archivo. Se um arquivo sumir,
  // o navegador cai na fonte de reserva e isto acusa.
  await expect(page.getByRole('heading', { name: 'Styleguide' })).toHaveCSS(
    'font-family',
    /^TheMix/,
  );
  await expect(page.locator('body')).toHaveCSS('font-family', /^"?Archivo Variable/);
  const carregadas = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].map((face) => `${face.family} ${face.weight} ${face.style}`);
  });
  expect(carregadas).toContain('TheMix 700 normal');
  expect(carregadas.some((font) => font.startsWith('Archivo Variable'))).toBe(true);
});

test('mantém a aparência da página do styleguide', async ({ page }) => {
  // Sem referência para esta plataforma o teste é pulado com instrução, em vez
  // de falhar por um arquivo que ninguém gerou ainda. `--update-snapshots`
  // (npm run test:e2e:update) muda o modo e cria a imagem.
  const criandoReferencia = test.info().config.updateSnapshots !== 'missing';
  test.skip(
    !existsSync(baseline) && !criandoReferencia,
    `Sem imagem de referência para ${process.platform}. Gere com: npm run test:e2e:update`,
  );

  await page.goto('/styleguide');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveScreenshot(screenshotName, { fullPage: true });
});
