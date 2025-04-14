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

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setUserLoading(true); setUser(null);
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
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? <p className="text-gray-600">Loading...</p> : (
            <>
              {showForgotPassword ? (
                <div className="mb-6">
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
                      <input
                        type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >Send Reset Password Email</button>
                  </form>
                </div>
              ) : (
                <div className="mb-6">
                  {showSignup ? (
                    <form onSubmit={handleSignupSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email:
                        </label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password:</label><input type="password" id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                          type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Sign Up
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email:
                        </label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password:</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                          type="submit"
                          className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >Login</button>
                    </form>
                    )}
                </div>
              )}
            </>
          )}
          <div className="mt-4 space-x-4">
            <button onClick={handleSignOut} className="px-4 py-2 text-blue-500 bg-gray-100 rounded-md hover:bg-gray-200">Sign Out</button>
            <button onClick={() => setShowSignup(!showSignup)} className="px-4 py-2 text-blue-500 bg-gray-100 rounded-md hover:bg-gray-200">
              {showSignup ? "Go to Login" : "Sign Up"}
            </button>
            <button onClick={() => setShowForgotPassword(!showForgotPassword)} className="px-4 py-2 text-blue-500 bg-gray-100 rounded-md hover:bg-gray-200">{showForgotPassword ? "Close Forgot Password" : "Forgot Password?"}</button>
          </div>
        </div>
  )
};
