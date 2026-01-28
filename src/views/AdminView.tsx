import { useState, forwardRef } from 'react';
import { Shield, Lock, LogIn, LogOut } from 'lucide-react';
import type { Matchday, Team, MatchReport } from '@/types/league';
import { AdminMatchesView } from '@/components/admin/AdminMatchesView';
import { AdminReportsView } from '@/components/admin/AdminReportsView';
import { AdminTeamsView } from '@/components/admin/AdminTeamsView';

interface AdminViewProps {
  matchdays: Matchday[];
  teams: Team[];
  matchReports: MatchReport[];
}

type AdminModal = 'matches' | 'reports' | 'teams' | null;

export function AdminView({ matchdays, teams, matchReports }: AdminViewProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState<AdminModal>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation - in production this would check against Firebase
    if (username && password) {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Por favor, introduce usuario y contraseña');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  if (!isLoggedIn) {
    return (
      <div className="animate-fade-up">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Administración</h2>
          <p className="text-sm text-muted-foreground">Acceso restringido</p>
        </div>

        <div className="glass-card p-6 max-w-sm mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Tu usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Panel de Admin</h2>
          <p className="text-sm text-muted-foreground">Gestión de la liga</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard 
          title="Gestión de Partidos"
          description={`${matchdays.length} jornadas • Ver resultados y editar`}
          icon="⚽"
          onClick={() => setActiveModal('matches')}
        />
        <AdminCard 
          title="Actas Digitales"
          description={`${matchReports.length} actas • Alineaciones, goles y tarjetas`}
          icon="📋"
          onClick={() => setActiveModal('reports')}
        />
        <AdminCard 
          title="Equipos y Jugadores"
          description={`${teams.length} equipos • Gestionar plantillas`}
          icon="👥"
          onClick={() => setActiveModal('teams')}
        />
        <AdminCard 
          title="Campo Táctico"
          description="Visualización de formaciones"
          icon="🏟️"
          onClick={() => {}}
          disabled
        />
      </div>

      <div className="glass-card p-6 mt-4 text-center">
        <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">
          La edición de datos estará disponible próximamente
        </p>
      </div>

      {/* Modals */}
      {activeModal === 'matches' && (
        <AdminMatchesView 
          matchdays={matchdays} 
          matchReports={matchReports}
          onClose={() => setActiveModal(null)} 
        />
      )}
      {activeModal === 'reports' && (
        <AdminReportsView 
          matchdays={matchdays}
          matchReports={matchReports} 
          onClose={() => setActiveModal(null)} 
        />
      )}
      {activeModal === 'teams' && (
        <AdminTeamsView 
          teams={teams} 
          matchReports={matchReports}
          onClose={() => setActiveModal(null)} 
        />
      )}
    </div>
  );
}

interface AdminCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}

const AdminCard = forwardRef<HTMLButtonElement, AdminCardProps>(
  function AdminCard({ title, description, icon, onClick, disabled }, ref) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={`glass-card-hover p-5 text-left w-full transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-1 hover:ring-primary/50'
        }`}
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </button>
    );
  }
);
