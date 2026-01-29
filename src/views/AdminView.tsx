import { useState, forwardRef } from 'react';
import { Shield, Lock, LogIn, LogOut, Loader2, UserCheck, Users, Gavel, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Matchday, Team, MatchReport, TopScorer, CardRanking } from '@/types/league';
import { AdminMatchesView } from '@/components/admin/AdminMatchesView';
import { AdminTeamsView } from '@/components/admin/AdminTeamsView';
import { AdminReportsManager } from '@/components/admin/AdminReportsManager';

interface AdminViewProps {
  matchdays: Matchday[];
  teams: Team[];
  matchReports: MatchReport[];
  topScorers: TopScorer[];
  cardRankings: CardRanking[];
  onDataRefresh: () => void;
}

type AdminModal = 'matches' | 'teams' | 'reports' | null;

export function AdminView({ matchdays, teams, matchReports, topScorers, cardRankings, onDataRefresh }: AdminViewProps) {
  const { currentUser, userData, loading, error, signIn, signOut, isAdmin, isReferee, isDelegate } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<AdminModal>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    await signIn(email, password);
    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    await signOut();
    setEmail('');
    setPassword('');
  };

  const getRoleIcon = () => {
    if (isAdmin) return <UserCheck className="w-5 h-5 text-primary" />;
    if (isReferee) return <Gavel className="w-5 h-5" style={{ color: 'hsl(var(--warning))' }} />;
    if (isDelegate) return <Users className="w-5 h-5" style={{ color: 'hsl(210, 100%, 60%)' }} />;
    return null;
  };

  const getRoleName = () => {
    if (isAdmin) return 'Administrador';
    if (isReferee) return 'Árbitro';
    if (isDelegate) return 'Delegado';
    return 'Usuario';
  };

  const getRoleBadgeColor = () => {
    if (isAdmin) return 'bg-primary/20 text-primary border-primary/30';
    if (isReferee) return 'bg-warning/20 text-warning border-warning/30';
    if (isDelegate) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-muted text-muted-foreground';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="animate-fade-up flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show login form if not authenticated
  if (!currentUser || !userData) {
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
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="tu@email.com"
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Acceso exclusivo para administradores, árbitros y delegados de la liga
          </p>
        </div>
      </div>
    );
  }

  // Determine which features are available based on role
  const canManageMatches = isAdmin || isReferee;
  const canManageTeams = isAdmin || isDelegate;
  const canViewTacticalField = isAdmin || isReferee || isDelegate;

  return (
    <div className="animate-fade-up flex flex-col min-h-[85vh]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Panel de Administración</h2>
          <p className="text-sm text-muted-foreground">Bienvenido, {userData.fullName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getRoleBadgeColor()}`}>
            {getRoleIcon()}
            <span className="text-sm font-medium">{getRoleName()}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {/* Role-specific welcome message */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isAdmin ? 'bg-primary/20' : isReferee ? 'bg-warning/20' : 'bg-blue-500/20'}`}>
            {getRoleIcon()}
          </div>
          <div>
            <h3 className="font-semibold">
              {isAdmin && 'Acceso completo'}
              {isReferee && 'Acceso de árbitro'}
              {isDelegate && 'Acceso de delegado'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isAdmin && 'Tienes permisos para gestionar todos los aspectos de la liga'}
              {isReferee && 'Puedes gestionar partidos y actas digitales'}
              {isDelegate && 'Puedes gestionar equipos y jugadores de tu equipo'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 flex-1 content-start">
        <AdminCard 
          title="Gestión de Partidos y Actas"
          description={`${matchdays.length} jornadas • Resultados, alineaciones y actas`}
          icon="⚽"
          onClick={() => setActiveModal('matches')}
          disabled={!canManageMatches}
          disabledMessage={!canManageMatches ? 'Requiere rol de administrador o árbitro' : undefined}
        />
        <AdminCard 
          title="Equipos y Jugadores"
          description={`${teams.length} equipos • Gestionar plantillas`}
          icon="👥"
          onClick={() => setActiveModal('teams')}
          disabled={!canManageTeams}
          disabledMessage={!canManageTeams ? 'Requiere rol de administrador o delegado' : undefined}
        />
        <AdminCard 
          title="Actas y Estadísticas"
          description={`${matchReports.length} actas • Ver goleadores y tarjetas`}
          icon="📊"
          onClick={() => setActiveModal('reports')}
          disabled={!isAdmin}
          disabledMessage={!isAdmin ? 'Requiere rol de administrador' : undefined}
        />
        <AdminCard 
          title="Campo Táctico"
          description="Visualización de formaciones"
          icon="🏟️"
          onClick={() => {}}
          disabled={!canViewTacticalField}
          disabledMessage="Próximamente disponible"
        />
      </div>

      {!isAdmin && (
        <div className="glass-card p-6 mt-4 text-center">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            Algunas funciones están restringidas según tu rol
          </p>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'matches' && canManageMatches && (
        <AdminMatchesView 
          matchdays={matchdays} 
          matchReports={matchReports}
          teams={teams}
          onClose={() => setActiveModal(null)}
          onDataChange={onDataRefresh}
        />
      )}
      {activeModal === 'teams' && canManageTeams && (
        <AdminTeamsView 
          teams={teams} 
          matchReports={matchReports}
          onClose={() => setActiveModal(null)}
          onDataChange={onDataRefresh}
        />
      )}
      {activeModal === 'reports' && isAdmin && (
        <AdminReportsManager 
          matchdays={matchdays}
          matchReports={matchReports}
          topScorers={topScorers}
          cardRankings={cardRankings}
          onClose={() => setActiveModal(null)}
          onDataChange={onDataRefresh}
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
  disabledMessage?: string;
}

const AdminCard = forwardRef<HTMLButtonElement, AdminCardProps>(
  function AdminCard({ title, description, icon, onClick, disabled, disabledMessage }, ref) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={`glass-card-hover p-5 text-left w-full transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-1 hover:ring-primary/50'
        }`}
        title={disabledMessage}
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl">{icon}</span>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            {disabled && disabledMessage && (
              <p className="text-xs text-destructive mt-1">{disabledMessage}</p>
            )}
          </div>
        </div>
      </button>
    );
  }
);
