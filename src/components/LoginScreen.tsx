import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  ArrowRight, 
  GraduationCap, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { login, AuthUser } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('alex');
  const [password, setPassword] = useState('student123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (userToSubmit?: string, passToSubmit?: string) => {
    const finalUser = userToSubmit || username;
    const finalPass = passToSubmit || password;

    if (!finalUser || !finalPass) {
      setErrorMessage('Please enter both your campus username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await login(finalUser, finalPass);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (quickUser: string, quickPass: string) => {
    setUsername(quickUser);
    setPassword(quickPass);
    handleLogin(quickUser, quickPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-slate-900 items-center justify-center text-teal-400 font-bold shadow-lg shadow-slate-900/10 mb-4">
          <Building2 className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          CampusFix <span className="text-teal-600">AI</span>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Intelligent University Maintenance Operations & Triage Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Campus Username
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex or marcus"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In with SSO'}</span>
              <ArrowRight className="w-4 h-4 text-teal-400" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-center mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                1-Click Demo Profiles (Bcrypt & JWT Verified)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('alex', 'student123')}
                disabled={isLoading}
                className="flex flex-col text-left p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-teal-700">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                  <span>Student Demo</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Alex Chen</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">alex / student123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('marcus', 'staff123')}
                disabled={isLoading}
                className="flex flex-col text-left p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-teal-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Staff Lead Demo</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Marcus Vance</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">marcus / staff123</div>
              </button>
            </div>
          </div>

          {/* Cryptographic Security Note */}
          <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
            <KeyRound className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">Server-Side Auth Enforced: </span>
              All ticket modifications and Gemini API requests require verified signed JWT tokens. User identity is strictly derived on the server.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
