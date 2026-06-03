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

  if (user) return <Navigate to="/negocios" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/negocios');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div {...fadeUp} className="w-full max-w-sm relative z-10">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl mb-5 shadow-glow-sm">
            <span className="font-display font-bold text-lg text-indigo-400 tracking-tight">SP</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Superpanel</h1>
          <p className="text-zinc-500 text-sm mt-1.5">León Ventures · Acceso privado</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-modal p-7">
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
                className="bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3"
              >
                <p className="text-red-400 text-sm">{error}</p>
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
