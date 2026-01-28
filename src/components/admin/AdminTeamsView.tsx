import { useState } from 'react';
import { X, Users, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Team, MatchReport, MatchReportPlayer } from '@/types/league';

interface AdminTeamsViewProps {
  teams: Team[];
  matchReports: MatchReport[];
  onClose: () => void;
}

export function AdminTeamsView({ teams, matchReports, onClose }: AdminTeamsViewProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlayerStats = (playerName: string, teamName: string) => {
    let goals = 0, yellowCards = 0, redCards = 0, gamesPlayed = 0;

    matchReports.forEach(report => {
      const teamData = report[teamName];
      if (typeof teamData === 'object' && teamData && 'players' in teamData) {
        const players = (teamData as { players: MatchReportPlayer[] }).players || [];
        const player = players.find(p => p.name === playerName);
        if (player) {
          gamesPlayed++;
          goals += player.goals || 0;
          yellowCards += player.yellowCards || 0;
          redCards += (player.redCards || 0) + (player.directRedCards || 0);
        }
      }
    });

    return { goals, yellowCards, redCards, gamesPlayed };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 glass-card border-b border-border/50 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {selectedTeam ? selectedTeam.name : 'Gestión de Equipos'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedTeam 
                ? `${selectedTeam.players?.length || 0} jugadores`
                : `${teams.length} equipos registrados`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedTeam ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-sm text-primary hover:underline"
              >
                ← Volver a equipos
              </button>

              <div className="space-y-2">
                {selectedTeam.players?.map((player) => {
                  const stats = getPlayerStats(player.name, selectedTeam.name);
                  
                  return (
                    <div
                      key={player.id}
                      className="glass-card p-3 bg-secondary/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              #{player.id} {player.alias || player.name}
                            </p>
                            {player.alias && (
                              <p className="text-xs text-muted-foreground">{player.name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-bold">{stats.gamesPlayed}</p>
                            <p className="text-xs text-muted-foreground">PJ</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-primary">{stats.goals}</p>
                            <p className="text-xs text-muted-foreground">Goles</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-4 bg-warning rounded-sm" />
                            <span className="font-medium">{stats.yellowCards}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-4 bg-destructive rounded-sm" />
                            <span className="font-medium">{stats.redCards}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!selectedTeam.players || selectedTeam.players.length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay jugadores registrados</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar equipo..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {/* Teams list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className="glass-card p-4 text-left hover:ring-1 hover:ring-primary/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.players?.length || 0} jugadores
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filteredTeams.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No se encontraron equipos</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
