import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

describe('App', () => {
  it('renders the get started heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /get started/i })).toBeInTheDocument();
  });
});
