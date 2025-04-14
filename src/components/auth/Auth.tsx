import { useState, FormEvent, useEffect } from "react";
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store';
import { UserInsert } from '../../types';

interface AuthProps { onLoginSuccess: () => void }

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setUser, setLoading: setUserLoading, setError: setUserError } = useUserStore();

  useEffect(() => {
    if (user) { onLoginSuccess() }
  }, [user]);



  const handleLoginSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Refresca el usuario tras login
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);
      setUserLoading(false);
      setError(null);
      onLoginSuccess();
    }
  };

    const handleSignupSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const { error: signUpError, data } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else {
            if (data?.user) {
                const user: UserInsert = { id: data.user.id, email: data.user.email! };
                const { error: insertError } = await supabase.from('users').insert({
                    ...user,
                    status: 'pending'
                });
                if (insertError) {
                    setError(insertError.message);
                } else {
                    setError('User created. Please, wait for admin approval.');
                }
            }
            setLoading(false);
        };
    };

    const handleForgotPasswordSubmit = async (event: FormEvent) => {
      event.preventDefault();
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:5173/' });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setLoading(false);
        setUserError(null);
      }
    };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signOut();
    setUser({} as any)
    if (error) {
      setError(error.message);
      setUserError(error.message);
    }

    setLoading(false);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-blue-100">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.svg" alt="Logo" className="w-20 h-20 mb-2" />
          <h2 className="text-3xl font-extrabold text-blue-700 mb-2 tracking-tight">Gestor de Recetas</h2>
          <p className="text-gray-400 text-sm">Inicia sesión para continuar</p>
        </div>
        {error && <p className="text-red-500 mb-4 text-center font-medium">{error}</p>}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.313 2.687 6 6 6v-1.709z" />
            </svg>
            <span className="text-blue-600 font-semibold">Cargando...</span>
          </div>
        ) : (
          <>
            {showForgotPassword ? (
              <div className="mb-6">
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-blue-700">Email</label>
                    <input
                      type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"/>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow font-semibold transition"
                  >Enviar enlace de recuperación</button>
                </form>
              </div>
            ) : (
              <div className="mb-6">
                {showSignup ? (
                  <form onSubmit={handleSignupSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-blue-700">Email</label>
                      <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"/>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-blue-700">Contraseña</label>
                      <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"/>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow font-semibold transition"
                    >Crear cuenta</button>
                  </form>
                ) : (
                  <form onSubmit={handleLoginSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-blue-700">Email</label>
                      <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-blue-700">Contraseña</label>
                      <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50" />
                    </div>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow font-semibold transition"
                    >Iniciar sesión</button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
        <div className="mt-6 flex flex-col items-center gap-2">
          <button onClick={handleSignOut} className="w-full px-4 py-2 text-blue-500 bg-blue-100 rounded-lg hover:bg-blue-200 transition">Cerrar sesión</button>
          <button onClick={() => setShowSignup(!showSignup)} className="w-full px-4 py-2 text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition">
            {showSignup ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
          </button>
          <button onClick={() => setShowForgotPassword(!showForgotPassword)} className="w-full px-4 py-2 text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition">
            {showForgotPassword ? "Cerrar recuperación" : "¿Olvidaste tu contraseña?"}
          </button>
        </div>
      </div>
    </div>
  )
};
