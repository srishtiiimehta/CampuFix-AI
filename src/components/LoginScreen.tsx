import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Building2, Lock, Mail, UserRound } from 'lucide-react';
import { createAccount, login, type AuthUser } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (isSignUp) {
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        const response = await createAccount(fullName.trim(), email.trim(), password);
        if (response.token && response.user) {
          onLoginSuccess(response.user);
        } else {
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
          setSuccessMessage(response.message || 'Account created. Check your email to confirm your account, then sign in.');
        }
      } else {
        const response = await login(email.trim(), password);
        onLoginSuccess(response.user);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isSignUp ? 'Account creation failed.' : 'Sign-in failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMessage('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-slate-900 items-center justify-center shadow-lg mb-4">
          <Building2 className="w-8 h-8 text-teal-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">CampusFix <span className="text-teal-600">AI</span></h1>
        <p className="mt-1 text-sm text-slate-500">University Facilities Portal</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <form onSubmit={handleSubmit} className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isSignUp ? 'Create your student account' : 'Welcome back'}</h2>
            <p className="mt-1 text-sm text-slate-500">{isSignUp ? 'Sign up with your university email to get started.' : 'Sign in to your university account.'}</p>
          </div>
          {errorMessage && <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs"><AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMessage}</span></div>}
          {successMessage && <div role="status" className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{successMessage}</div>}
          {isSignUp && <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full name</label>
            <div className="relative"><UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="fullName" name="name" type="text" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
          </div>}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email address</label>
            <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@university.edu" className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="password" name="password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
          </div>
          {isSignUp && <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Confirm password</label>
            <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
          </div>}
          <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60">
            <span>{isLoading ? (isSignUp ? 'Creating account…' : 'Signing in…') : (isSignUp ? 'Create account' : 'Sign in')}</span><ArrowRight className="w-4 h-4 text-teal-400" />
          </button>
          <p className="text-center text-sm text-slate-600">
            {isSignUp ? 'Already have an account?' : 'New to CampusFix?'}{' '}
            <button type="button" onClick={switchMode} className="font-semibold text-teal-700 hover:text-teal-800">{isSignUp ? 'Sign in' : 'Create an account'}</button>
          </p>
        </form>
      </div>
    </main>
  );
};
