import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import type { LoginState } from './actions';

const { loginAction } = vi.hoisted(() => ({
  loginAction: vi.fn<(previousState: LoginState, formData: FormData) => Promise<LoginState>>(),
}));

vi.mock('@/features/admin-auth/actions', () => ({ loginAction, logoutAction: vi.fn() }));

describe('LoginForm', () => {
  beforeEach(() => {
    loginAction.mockReset();
  });

  it('renders the username and password fields with their labels', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Usuário')).toHaveAttribute('name', 'username');
    expect(screen.getByLabelText('Usuário')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('name', 'password');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('toggles the password visibility without submitting the form', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    expect(loginAction).not.toHaveBeenCalled();
  });

  it('sends the credentials and shows the error returned by the action', async () => {
    loginAction.mockResolvedValue({ error: 'Usuário ou senha incorretos.' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Usuário'), 'loja');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha incorretos.');
    const formData = loginAction.mock.calls[0][1];
    expect(formData.get('username')).toBe('loja');
    expect(formData.get('password')).toBe('errada');
  });

  it('disables the submit button while the action is pending', async () => {
    let finishLogin: (state: LoginState) => void = () => {};
    loginAction.mockReturnValue(new Promise((resolve) => (finishLogin = resolve)));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('button', { name: 'Entrando…' })).toBeDisabled();
    finishLogin({ error: null });
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeEnabled();
  });
});
