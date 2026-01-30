import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Users, Gavel, UserCheck, AlertTriangle, Eye, EyeOff, Save, RefreshCw, Pencil } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Team } from '@/types/league';
import { useAuth } from '@/contexts/AuthContext';

interface AdminUsersManagerProps {
  teams: Team[];
  onClose: () => void;
  onDataChange: () => void;
}

export function AdminUsersManager({ teams, onClose, onDataChange }: AdminUsersManagerProps) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'delegate' as 'admin' | 'referee' | 'delegate',
    teamName: ''
  });
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    password: '',
    fullName: '',
    role: 'delegate' as 'admin' | 'referee' | 'delegate',
    teamName: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar usuarios');
    }
    setLoading(false);
  };

  const handleCreateUser = async () => {
    if (!formData.username || !formData.password || !formData.fullName) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.role === 'delegate' && !formData.teamName) {
      setError('Los delegados deben tener un equipo asignado');
      return;
    }

    if (formData.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    // Check if username already exists
    const existingUser = users.find(u => u.username.toLowerCase() === formData.username.toLowerCase());
    if (existingUser) {
      setError('Este nombre de usuario ya existe');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create user document in Firestore (no Firebase Auth needed)
      await addDoc(collection(db, 'users'), {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        teamName: formData.role === 'delegate' ? formData.teamName : null
      });

      setSuccess(`Usuario ${formData.fullName} creado correctamente`);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        role: 'delegate',
        teamName: ''
      });
      setShowCreateForm(false);
      fetchUsers();
      onDataChange();
      
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(`Error: ${err.message}`);
    }
    setIsCreating(false);
  };

  const handleUpdateUser = async (userId: string) => {
    if (!editFormData.password || !editFormData.fullName) {
      setError('La contraseña y el nombre son obligatorios');
      return;
    }

    if (editFormData.role === 'delegate' && !editFormData.teamName) {
      setError('Los delegados deben tener un equipo asignado');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        password: editFormData.password,
        fullName: editFormData.fullName,
        role: editFormData.role,
        teamName: editFormData.role === 'delegate' ? editFormData.teamName : null
      });
      setSuccess('Usuario actualizado correctamente');
      setEditingUser(null);
      fetchUsers();
      onDataChange();
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(`Error: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setSuccess('Usuario eliminado correctamente');
      fetchUsers();
      onDataChange();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Error al eliminar usuario');
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const startEditing = (user: User) => {
    setEditingUser(user.id);
    setEditFormData({
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      teamName: user.teamName || ''
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <UserCheck className="w-4 h-4 text-primary" />;
      case 'referee': return <Gavel className="w-4 h-4" style={{ color: 'hsl(var(--warning))' }} />;
      case 'delegate': return <Users className="w-4 h-4 text-blue-400" />;
      default: return null;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'referee': return 'Árbitro';
      case 'delegate': return 'Delegado';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/20 text-primary border-primary/30';
      case 'referee': return 'bg-warning/20 text-warning border-warning/30';
      case 'delegate': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold">Gestión de Usuarios</h2>
          <p className="text-sm text-muted-foreground">Administrar delegados y árbitros</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-destructive hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-primary hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Actions */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Crear Usuario
          </button>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Info about user creation */}
        <div className="glass-card p-4 mb-4 bg-blue-500/5 border-blue-500/20">
          <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Información sobre roles
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Delegados:</strong> Solo pueden acceder a su equipo asignado</li>
            <li>• <strong>Árbitros:</strong> Solo pueden ver/editar actas de partidos donde estén asignados</li>
            <li>• Los usuarios usan nombre de usuario y contraseña (sin necesidad de email)</li>
          </ul>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="glass-card p-4 mb-4">
            <h3 className="font-semibold mb-4">Crear nuevo usuario</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">Usuario *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none"
                  placeholder="Nombre de usuario"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none"
                    placeholder="Mínimo 4 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre completo *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none"
                  placeholder="Nombre y apellidos"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'referee' | 'delegate' })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none"
                >
                  <option value="delegate">Delegado de equipo</option>
                  <option value="referee">Árbitro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              {formData.role === 'delegate' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Equipo asignado *</label>
                  <select
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none"
                  >
                    <option value="">Seleccionar equipo...</option>
                    {teams.sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                      <option key={team.id} value={team.name}>{team.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleCreateUser}
                disabled={isCreating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isCreating ? 'Creando...' : 'Crear usuario'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ username: '', password: '', fullName: '', role: 'delegate', teamName: '' });
                }}
                className="px-4 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="font-semibold mb-3">Usuarios registrados ({users.length})</h3>
            {users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay usuarios registrados</p>
            ) : (
              users.map(user => (
                <div key={user.id} className="glass-card p-4">
                  {editingUser === user.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-muted-foreground">Editando:</span>
                        <span className="font-medium">{user.username}</span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium mb-1">Nombre completo</label>
                          <input
                            type="text"
                            value={editFormData.fullName}
                            onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Contraseña</label>
                          <input
                            type="text"
                            value={editFormData.password}
                            onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Rol</label>
                          <select
                            value={editFormData.role}
                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'admin' | 'referee' | 'delegate' })}
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-sm"
                          >
                            <option value="delegate">Delegado</option>
                            <option value="referee">Árbitro</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                        {editFormData.role === 'delegate' && (
                          <div>
                            <label className="block text-xs font-medium mb-1">Equipo</label>
                            <select
                              value={editFormData.teamName}
                              onChange={(e) => setEditFormData({ ...editFormData, teamName: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-sm"
                            >
                              <option value="">Seleccionar...</option>
                              {teams.sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                <option key={team.id} value={team.name}>{team.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateUser(user.id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm"
                        >
                          <Save className="w-3 h-3" />
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="px-3 py-1.5 rounded-lg bg-secondary text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          user.role === 'admin' ? 'bg-primary/20' : 
                          user.role === 'referee' ? 'bg-warning/20' : 'bg-blue-500/20'
                        }`}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.username}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Contraseña:</span>
                            <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">
                              {visiblePasswords.has(user.id) ? user.password : '••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="p-0.5 text-muted-foreground hover:text-foreground"
                            >
                              {visiblePasswords.has(user.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                          {user.role === 'delegate' && user.teamName && (
                            <p className="text-xs text-blue-400 mt-1">Equipo: {user.teamName}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </div>
                        
                        <button
                          onClick={() => startEditing(user)}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar usuario"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        
                        {deleteConfirm === user.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-3 py-1 rounded bg-destructive text-destructive-foreground text-xs"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 rounded bg-secondary text-xs"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
