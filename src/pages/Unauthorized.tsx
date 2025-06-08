import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized: React.FC = () => {
  const { userRole } = useAuth();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f7fafc'
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        color: '#e53e3e',
        marginBottom: '1rem'
      }}>
        Access Denied
      </h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
          You don't have permission to access this page.
        </p>
        
        <p style={{ marginBottom: '1.5rem', color: '#4a5568' }}>
          Your current role: <strong>{userRole}</strong>
        </p>
        
        <Link 
          to="/" 
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3182ce',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized; 