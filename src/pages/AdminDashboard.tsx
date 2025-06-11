import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import '../styles/Admin.css';
import { getAllProfilesWithCache, invalidateAllProfilesCache } from '../lib/adminService';

type Profile = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
};

const AdminDashboard: React.FC = () => {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        
        // Fetch profiles using cache
        const profilesData = await getAllProfilesWithCache();
        
        // Set the profiles
        setProfiles(profilesData);
      } catch (error) {
        console.error('Error in fetchProfiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating role:', error);
        return;
      }

      // Update the local state
      setProfiles(profiles.map(profile => 
        profile.id === userId ? { ...profile, role: newRole } : profile
      ));
      // Invalidate cache after role change
      invalidateAllProfilesCache();
    } catch (error) {
      console.error('Error in handleRoleChange:', error);
    }
  };

  return (
    <div className="admin-container">
      <nav className="admin-nav">
        <div className="nav-brand">Admin Panel</div>
        <div className="nav-actions">
          <Link to="/" className="nav-link">Home</Link>
          <span className="admin-badge">Admin</span>
          <button className="logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </nav>
      
      <div className="admin-content">
        <div className="welcome-section">
          <h1>Admin Dashboard</h1>
          <p className="welcome-message">
            Welcome, <strong>{user?.email}</strong> (Admin)
          </p>
        </div>
        
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-value">{profiles.length}</p>
          </div>
          <div className="stat-card">
            <h3>Admin Users</h3>
            <p className="stat-value">
              {profiles.filter(profile => profile.role === 'admin').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Regular Users</h3>
            <p className="stat-value">
              {profiles.filter(profile => profile.role === 'user').length}
            </p>
          </div>
        </div>
        
        <div className="admin-table-container">
          <h2>User Management</h2>
          {loading ? (
            <p>Loading profiles...</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(profile => (
                  <tr key={profile.id}>
                    <td>{profile.id}</td>
                    <td>
                      <span className={`role-badge ${profile.role}`}>
                        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      </span>
                    </td>
                    <td>{new Date(profile.created_at).toLocaleDateString()}</td>
                    <td>
                      <select 
                        value={profile.role}
                        onChange={(e) => handleRoleChange(profile.user_id, e.target.value)}
                        className="role-select"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 