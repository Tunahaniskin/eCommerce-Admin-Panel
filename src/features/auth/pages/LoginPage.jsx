import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('mysecretpassword');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result && result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result?.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>eCommerce Admin</h1>
          <p>Yönetim paneline giriş yapın</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email Adresi</label>
            <input 
              type="email" 
              id="email"
              className="form-control" 
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <input 
              type="password" 
              id="password"
              className="form-control" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
