import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store/hooks';
import { loginUser } from '../../../store/slices/authSlice';
import { Box, TextField, Button, Typography, Paper, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';

export const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone || !name) {
      setError('Phone number and name are required');
      return;
    }
    setLoading(true);
    try {
      await dispatch(loginUser({ phone, name, role })).unwrap();
      navigate(role === 'recruiter' ? '/recruiter/dashboard' : '/interview');
    } catch (err: any) {
      setError(err.message || err || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 2 }}>
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 400, width: '100%', borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">AI Interview Platform</Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>Sign in to continue</Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ToggleButtonGroup
            value={role}
            exclusive
            onChange={(_, val) => val && setRole(val)}
            size="small"
          >
            <ToggleButton value="candidate">Candidate</ToggleButton>
            <ToggleButton value="recruiter">Recruiter</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} margin="normal" required placeholder="+1234567890" />
          <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} margin="normal" required placeholder="John Doe" />
          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, mb: 2 }}>
            {loading ? 'Signing in...' : `Sign in as ${role === 'recruiter' ? 'Recruiter' : 'Candidate'}`}
          </Button>
        </form>

        <Typography variant="caption" color="text.secondary" align="center" display="block">By continuing, you agree to our Terms of Service</Typography>
      </Paper>
    </Box>
  );
};
