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
  const [accountType, setAccountType] = useState<'student' | 'staff'>('student');
  const [category, setCategory] = useState('Student');
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
        const response = await createAccount(fullName.trim(), email.trim(), password, accountType, category);
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
    <main className="login-screen">
      <div className="login-layout">
        <section className="login-story" aria-labelledby="login-story-title">
          <div className="login-story-top">
            <span className="login-brand"><span className="login-brand-icon"><Building2 aria-hidden="true" /></span> CampusFix <b>AI</b></span>
            <span className="login-live-label"><span /> Campus facilities, connected</span>
          </div>

          <div className="login-story-copy">
            <p className="eyebrow">A better campus starts here</p>
            <h1 id="login-story-title"><span>Your campus.</span><span>Let’s fix it.</span></h1>
            <p className="login-story-description">Broken lights? Leaky taps? Wi-Fi having a bad day? Tell us what’s up. We’ll get it to the right team.</p>
          </div>

          <div className="login-campus-art" aria-hidden="true">
            <div className="art-orbit art-orbit-one" />
            <div className="art-orbit art-orbit-two" />
            <div className="art-sun" />
            <div className="art-cloud art-cloud-one" />
            <div className="art-cloud art-cloud-two" />
            <div className="art-campus-ground" />
            <svg className="art-building" viewBox="0 0 460 280" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 112 230 36l170 76v135H60V112Z" fill="#E5EFE4" />
              <path d="M60 112 230 36l170 76-170 38L60 112Z" fill="#F7F3E9" />
              <path d="m60 112 170 38v21L60 133v-21Z" fill="#B9D4C4" />
              <path d="m230 150 170-38v21l-170 38v-21Z" fill="#A8D4D3" />
              <path d="M91 154 230 184l139-31v94H91v-93Z" fill="#C7DCC7" />
              <path d="M91 154 230 184v63H91v-93Z" fill="#DDF0E7" />
              <path d="m230 184 139-31v94H230v-63Z" fill="#B4D2C4" />
              <path d="M203 193h54v55h-54z" fill="#103E32" />
              <path d="M111 174h36v30h-36zM160 184h30v27h-30zM277 182h31v27h-31zM323 170h30v30h-30z" fill="#A8D4D3" />
              <path d="M117 180h24v18h-24zM166 190h18v15h-18zM283 188h19v15h-19zM329 176h18v18h-18z" fill="#F7F3E9" />
              <path d="M46 249h368" stroke="#F7F3E9" strokeWidth="6" strokeLinecap="round" />
              <path d="M75 249v-22m310 22v-22" stroke="#F7F3E9" strokeWidth="5" strokeLinecap="round" />
              <path d="M60 226h30m295 0h30" stroke="#F2C9B5" strokeWidth="8" strokeLinecap="round" />
            </svg>
            <div className="art-float-card art-card-one"><span className="art-card-icon">✦</span><span><b>One clear report</b><small>We’ll route it from here</small></span></div>
            <div className="art-float-card art-card-two"><span className="art-pulse-dot" /><span><b>Facilities team</b><small>Connected to your campus</small></span></div>
            <span className="art-spark art-spark-one">✳</span><span className="art-spark art-spark-two">✦</span>
          </div>

          <div className="login-story-footer"><span>Report clearly.</span><span>Track confidently.</span><span>Move campus forward.</span></div>
        </section>

        <section className="login-panel" aria-label={isSignUp ? 'Create your CampusFix account' : 'Sign in to CampusFix'}>
          <div className="login-panel-heading">
            <span className="login-panel-mark"><Building2 aria-hidden="true" /></span>
            <div><p className="eyebrow">University facilities portal</p><h2>{isSignUp ? 'Join your campus' : 'Welcome back'}</h2><p>{isSignUp ? 'Create an account to report and follow campus issues.' : 'Sign in to your university account.'}</p></div>
          </div>

          <form onSubmit={handleSubmit} className="login-form-card">
            {errorMessage && <div role="alert" className="login-alert login-alert-error"><AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
            {successMessage && <div role="status" className="login-alert login-alert-success">{successMessage}</div>}

            {isSignUp && <div className="login-form-grid">
              <div className="login-field">
                <label htmlFor="accountType">Account type</label>
                <select id="accountType" value={accountType} onChange={(event) => { const next = event.target.value as 'student' | 'staff'; setAccountType(next); setCategory(next === 'student' ? 'Student' : 'Dean'); }}>
                  <option value="student">Student</option><option value="staff">Staff (requires approval)</option>
                </select>
              </div>
              <div className="login-field">
                <label htmlFor="category">{accountType === 'staff' ? 'Staff category' : 'Student category'}</label>
                <select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {(accountType === 'staff' ? ['Dean', 'Professor', 'Sweeper', 'Plumber', 'Electrician'] : ['Student', 'CR']).map((option) => <option key={option} value={option}>{option === 'CR' ? 'CR (Class Representative)' : option}</option>)}
                </select>
              </div>
              {accountType === 'staff' && <p className="login-staff-note">Staff accounts must confirm their email and be approved by an administrator. Selecting a staff category does not grant staff permissions.</p>}
            </div>}

            {isSignUp && <p className="login-staff-note">Use your @zenithschool.ai campus email. Confirm it before signing in.</p>}
            {isSignUp && <div className="login-field"><label htmlFor="fullName">Full name</label><div className="login-input-wrap"><UserRound aria-hidden="true" /><input id="fullName" name="name" type="text" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" /></div></div>}
            <div className="login-field"><label htmlFor="email">University email</label><div className="login-input-wrap"><Mail aria-hidden="true" /><input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@zenithschool.ai" /></div></div>
            <div className="login-field"><div className="login-label-row"><label htmlFor="password">Password</label>{!isSignUp && <span className="login-secure-hint">Secure sign in</span>}</div><div className="login-input-wrap"><Lock aria-hidden="true" /><input id="password" name="password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} /></div></div>
            {isSignUp && <div className="login-field"><label htmlFor="confirmPassword">Confirm password</label><div className="login-input-wrap"><Lock aria-hidden="true" /><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div></div>}
            <button type="submit" disabled={isLoading} className="login-submit"><span>{isLoading ? (isSignUp ? 'Creating account…' : 'Signing in…') : (isSignUp ? 'Create account' : 'Sign in')}</span><ArrowRight className="h-4 w-4" /></button>
            <p className="login-switch">{isSignUp ? 'Already have an account?' : 'New to CampusFix?'}{' '}<button type="button" onClick={switchMode}>{isSignUp ? 'Sign in' : 'Create an account'}</button></p>
          </form>

          <p className="login-panel-footnote"><span /> Your campus account, thoughtfully connected.</p>
        </section>
      </div>
    </main>
  );
};
