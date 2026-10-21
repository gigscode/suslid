import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>
}) {
  const params = await searchParams
  return (
    <LoginForm
      confirmationError={params.error === 'confirmation'}
      initialMode={
        params.mode === 'sign-up'
          ? 'sign-up'
          : params.mode === 'reset-password'
            ? 'reset-password'
            : 'sign-in'
      }
    />
  )
}
