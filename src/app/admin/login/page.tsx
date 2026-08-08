import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in' };

// Admin-only compact crest mark for the login card (chair-supplied).
// Sidebar uses the wider DB-driven brand banner for ambient presence;
// the login card needs a focused, compact mark instead.
const LOGIN_LOGO_SRC = '/assets/su-logo.png';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-gray-50 to-accent/5 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-7 sm:p-9">
        <div className="text-center mb-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGIN_LOGO_SRC}
            alt="Sonargaon University logo"
            className="h-16 w-auto mx-auto mb-4 object-contain"
          />
          <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400">
            Electrical and Electronics Engineering · Admin Panel
          </div>
          <h1 className="text-2xl font-display font-bold text-primary mt-2">
            Sign in
          </h1>
          <p className="text-xs text-gray-500 mt-1.5">
            Enter your admin credentials to continue.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
