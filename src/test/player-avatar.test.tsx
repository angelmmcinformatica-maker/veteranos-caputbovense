import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { ImageUpload } from '@/components/ui/image-upload';

describe('player photo fallback', () => {
  it('keeps a valid photo', () => {
    render(<PlayerAvatar photoUrl="/good.jpg" name="Jugador" dorsal={7} />);
    expect(screen.getByRole('img', { name: 'Jugador' })).toHaveAttribute('src', '/good.jpg');
  });

  it('shows the dorsal without a photo and after a failed load', () => {
    const { rerender } = render(<PlayerAvatar name="Jugador" dorsal={12} />);
    expect(screen.getByText('12')).toBeInTheDocument();
    rerender(<PlayerAvatar photoUrl="/missing.jpg" name="Jugador" dorsal={12} />);
    fireEvent.error(screen.getByRole('img', { name: 'Jugador' }));
    expect(screen.queryByRole('img', { name: 'Jugador' })).not.toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    rerender(<PlayerAvatar photoUrl="/replacement.jpg" name="Jugador" dorsal={12} />);
    expect(screen.getByRole('img', { name: 'Jugador' })).toHaveAttribute('src', '/replacement.jpg');
  });

  it('retains the upload control and shows its dorsal when an admin photo fails', () => {
    render(<ImageUpload currentUrl="/missing.jpg" placeholder={<span>9</span>} onUpload={async () => {}} />);
    fireEvent.error(screen.getByRole('presentation'));
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toContainElement(screen.getByText('9'));
  });
});