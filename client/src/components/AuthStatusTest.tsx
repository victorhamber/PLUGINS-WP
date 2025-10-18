import { useAuth } from '@/hooks/useAuth';

export default function AuthStatusTest() {
  const { user, isLoading, isAuthenticated } = useAuth();

  console.log('[AUTH STATUS TEST]', {
    user,
    isLoading,
    isAuthenticated,
    isAdmin: user?.isAdmin
  });

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded mb-4">
      <h2>🔐 Status de Autenticação</h2>
      <p><strong>Loading:</strong> {isLoading ? 'Sim' : 'Não'}</p>
      <p><strong>Authenticated:</strong> {isAuthenticated ? 'Sim' : 'Não'}</p>
      <p><strong>User:</strong> {user ? user.username : 'Nenhum'}</p>
      <p><strong>Is Admin:</strong> {user?.isAdmin ? 'Sim' : 'Não'}</p>
      <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
    </div>
  );
}