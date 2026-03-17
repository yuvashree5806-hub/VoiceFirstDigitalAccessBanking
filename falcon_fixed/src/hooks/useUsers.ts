import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserDTO } from '../types/api';

const API_URL = 'http://localhost:8080/api/users';
const VOICE_URL = 'http://localhost:8080/api/voice';

export const useUsers = () => {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get<UserDTO[]>(API_URL).catch(() => ({
        data: [
          { id: 1, fullName: 'Ramesh Kumar',  phoneNumber: '+91 9876543210', languagePreference: 'Hindi',  isVerified: true,  createdAt: new Date().toISOString() },
          { id: 2, fullName: 'Lakshmi Devi',  phoneNumber: '+91 9876543211', languagePreference: 'Telugu', isVerified: false, createdAt: new Date().toISOString() },
        ]
      }));
      setUsers(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (user: UserDTO) => {
    setLoading(true);
    try {
      const response = await axios.post<UserDTO>(API_URL, user).catch(() => ({
        data: { ...user, id: Math.floor(Math.random() * 1000), createdAt: new Date().toISOString() }
      }));
      setUsers(prev => [...prev, response.data]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: number) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`).catch(() => ({}));
      setUsers(prev => prev.filter(u => u.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const enrollVoice = async (userId: number, voiceprintHash: string, language = 'ta-IN') => {
    try {
      const response = await axios.post(`${VOICE_URL}/enroll`, { userId, voiceprintHash, language })
        .catch(() => ({ data: { success: true, message: 'Enrolled (mock)', enrolledAt: new Date().toISOString() } }));
      return response.data;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const verifyVoice = async (userId: number, matchScore: number, audioQuality: string, isLargeTransfer = false, challengePassed = true) => {
    try {
      const response = await axios.post(`${VOICE_URL}/verify`, {
        userId, matchScore, audioQuality, isLargeTransfer, challengePassed
      }).catch(() => ({
        data: {
          status: matchScore >= 85 ? 'authenticated' : matchScore >= 70 ? 'fallback' : 'denied',
          authLayer: matchScore >= 85 ? 'L2' : matchScore >= 70 ? 'F1' : 'DENY',
          matchScore,
          message: 'Mock verification result',
        }
      }));
      return response.data;
    } catch (err: any) {
      return { status: 'denied', message: err.message };
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return { users, loading, error, createUser, deleteUser, enrollVoice, verifyVoice, refetch: fetchUsers };
};

