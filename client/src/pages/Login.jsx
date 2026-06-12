import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { fadeUp } from '../lib/animations';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { user, login }         = useAuth();
  const navigate                = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      setError(typeof serverMsg === 'string' ? serverMsg : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-ios-blue/8 rounded-full blur-3xl" />
      </div>

      <motion.div {...fadeUp} className="w-full max-w-sm relative z-10">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-ios-blue rounded-ios-lg mb-5 shadow-glow">
            <span className="font-display font-bold text-xl text-white tracking-tight">SP</span>
          </div>
          <h1 className="font-display text-[28px] font-bold text-ios-label tracking-tight">Superpanel</h1>
          <p className="text-ios-label2 text-[15px] mt-1.5">León Ventures · Acceso privado</p>
        </div>

        {/* Card */}
        <div className="bg-ios-elev rounded-ios-lg p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="ivan@leonventures.com"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-ios-red/10 rounded-[12px] px-4 py-3"
              >
                <p className="text-ios-red text-[15px]">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full mt-1"
            >
              {loading ? 'Accediendo…' : 'Acceder'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
