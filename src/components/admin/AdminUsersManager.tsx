import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Users, Gavel, UserCheck, AlertTriangle, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
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
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
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
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.role === 'delegate' && !formData.teamName) {
      setError('Los delegados deben tener un equipo asignado');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const auth = getAuth();
      const currentUserEmail = currentUser?.email;
      
      // Store current admin credentials temporarily
      // Note: We'll need to re-authenticate the admin after creating the new user
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      // Create user document in Firestore
      await addDoc(collection(db, 'users'), {
        username: formData.email,
        password: formData.password, // Note: In production, don't store plain text passwords
        fullName: formData.fullName,
        role: formData.role,
        teamName: formData.role === 'delegate' ? formData.teamName : null,
        firebaseUid: userCredential.user.uid
      });

      setSuccess(`Usuario ${formData.fullName} creado correctamente`);
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'delegate',
        teamName: ''
      });
      setShowCreateForm(false);
      fetchUsers();
      onDataChange();
      
      // Note: After creating a user with Firebase Auth, the new user is automatically signed in
      // The admin will need to log in again
      setError('IMPORTANTE: Has sido deslogueado porque Firebase cambió la sesión al nuevo usuario. Por favor, vuelve a iniciar sesión.');
      
    } catch (err: any) {
      console.error('Error creating user:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado en Firebase Auth');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil');
      } else if (err.code === 'auth/invalid-email') {
        setError('El email no es válido');
      } else {
        setError(`Error: ${err.message}`);
      }
    }
    setIsCreating(false);
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
        <div className="glass-card p-4 mb-4 bg-warning/5 border-warning/20">
          <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Información importante
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Delegados:</strong> Solo pueden acceder a su equipo asignado</li>
            <li>• <strong>Árbitros:</strong> Solo pueden ver/editar actas de partidos donde estén asignados</li>
            <li>• Al crear un usuario, Firebase cambiará la sesión. Tendrás que volver a iniciar sesión.</li>
          </ul>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="glass-card p-4 mb-4">
            <h3 className="font-semibold mb-4">Crear nuevo usuario</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none"
                  placeholder="usuario@email.com"
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
                    placeholder="Mínimo 6 caracteres"
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
                  setFormData({ email: '', password: '', fullName: '', role: 'delegate', teamName: '' });
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
                <div key={user.id} className="glass-card p-4 flex items-center justify-between">
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
                      {user.role === 'delegate' && user.teamName && (
                        <p className="text-xs text-blue-400">Equipo: {user.teamName}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleName(user.role)}
                    </div>
                    
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
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
