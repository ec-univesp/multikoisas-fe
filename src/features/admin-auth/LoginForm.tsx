'use client';

import { useActionState, useState } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { EyeCloseIcon, EyeIcon } from '@/icons';
import { loginAction, type LoginState } from './actions';

const initialLoginState: LoginState = { error: null };
const ERROR_MESSAGE_ID = 'login-error';

export const LoginForm = () => {
  const [loginState, formAction, isPending] = useActionState(loginAction, initialLoginState);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const hasError = Boolean(loginState.error);

  return (
    <form action={formAction} className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Entrar</h1>
      <p className="mt-1.5 text-sm text-gray-500">Use o usuário e a senha da loja.</p>

      <div className="mt-8">
        <Label htmlFor="login-username">Usuário</Label>
        <Input
          key={loginState.username}
          id="login-username"
          name="username"
          autoComplete="username"
          autoFocus
          defaultValue={loginState.username}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? ERROR_MESSAGE_ID : undefined}
          className="text-base"
        />
      </div>

      <div className="mt-5">
        <Label htmlFor="login-password">Senha</Label>
        <div className="relative">
          <Input
            id="login-password"
            name="password"
            type={isPasswordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? ERROR_MESSAGE_ID : undefined}
            className="pr-12 text-base"
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            {isPasswordVisible ? (
              <EyeIcon aria-hidden className="fill-gray-500" />
            ) : (
              <EyeCloseIcon aria-hidden className="fill-gray-500" />
            )}
          </button>
        </div>
      </div>

      {loginState.error && (
        <p
          id={ERROR_MESSAGE_ID}
          role="alert"
          className="mt-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600"
        >
          {loginState.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="mt-7 h-11 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        {isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
};
