import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

function Login() {
  const { session } = useAuth();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Error logging in with Google:', error.message);
    }
  };

  if (session) {
    return <Navigate to="/" />;
  }

  return (
    // <-- ตรวจสอบว่า div นี้มี style ครบถ้วนตามนี้
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      textAlign: 'center'
    }}>
      <h1>Welcome</h1>
      <p>Please sign in to continue</p>
      <button onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </div>
  );
}

export default Login;