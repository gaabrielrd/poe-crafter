import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ScreenshotImporter } from '../components/ScreenshotImporter';
import { renderWithProviders } from '@/test/render';

describe('ScreenshotImporter', () => {
  it('processa uma imagem válida no fixture de desenvolvimento', async () => {
    const user = userEvent.setup();
    const onText = vi.fn();
    renderWithProviders(<ScreenshotImporter onText={onText} />);

    await user.upload(
      screen.getByLabelText('Imagem do item'),
      new File(['image'], 'item.png', { type: 'image/png' }),
    );

    expect(
      await screen.findByText('Texto extraído. Revise o alvo abaixo antes de confirmar.'),
    ).toBeInTheDocument();
    expect(onText).toHaveBeenCalledWith(expect.stringContaining('Divine Crown'));
  });

  it('informa tipo de imagem não suportado sem iniciar o OCR', () => {
    const onText = vi.fn();
    renderWithProviders(<ScreenshotImporter onText={onText} />);

    fireEvent.change(screen.getByLabelText('Imagem do item'), {
      target: { files: [new File(['image'], 'item.gif', { type: 'image/gif' })] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Use uma imagem PNG, JPEG ou WebP.');
    expect(onText).not.toHaveBeenCalled();
  });
});
