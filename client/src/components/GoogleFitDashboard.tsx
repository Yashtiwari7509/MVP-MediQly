import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import '../styles/animations.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Activity,
  Heart,
  Footprints,
  Flame,
  Moon,
  Timer,
  Scale,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { FitnessData } from '../types/fitness';

const GoogleFitDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fitnessData, setFitnessData] = useState<FitnessData | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { syncOfflineActions } = useOfflineSync();
  const { add: addToIndexedDB, getAll: getAllFromIndexedDB } = useIndexedDB();

  useEffect(() => {
    if (user?.googleAccessToken) {
      fetchFitnessData();
    }
  }, [user?.googleAccessToken]);

  const fetchFitnessData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/fitness-data`, {
        headers: {
          Authorization: `Bearer ${user?.googleAccessToken}`,
        },
      });

      if (response.data) {
        setFitnessData(response.data);
        // Store in IndexedDB for offline access
        await addToIndexedDB('fitnessData', response.data);
      }
    } catch (error) {
      console.error('Error fetching fitness data:', error);
      toast.error('Failed to fetch fitness data');
      
      // Try to get cached data from IndexedDB
      try {
        const cachedData = await getAllFromIndexedDB('fitnessData');
        if (cachedData && cachedData.length > 0) {
          setFitnessData(cachedData[0]);
          toast('Showing cached data');
        }
      } catch (cacheError) {
        console.error('Error fetching cached data:', cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsLoading(true);
        // Exchange the code for tokens
        const tokenResponse = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
          code: response.code,
        });

        if (tokenResponse.data) {
          // Store the tokens
          localStorage.setItem('googleAccessToken', tokenResponse.data.access_token);
          localStorage.setItem('googleRefreshToken', tokenResponse.data.refresh_token);
          
          // Fetch fitness data
          await fetchFitnessData();
          
          // Sync any pending offline actions
          await syncOfflineActions();
          
          toast.success('Successfully connected to Google Fit');
        }
      } catch (error) {
        console.error('Error during Google login:', error);
        toast.error('Failed to connect to Google Fit');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error('Google login failed');
      setIsLoading(false);
    },
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user?.googleAccessToken) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-semibold mb-4">Connect with Google Fit</h2>
        <p className="text-gray-600 mb-6">
          Connect your Google Fit account to track your fitness data and sync it with your health records.
        </p>
        <button
          onClick={() => login()}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Google Fit'}
        </button>
      </div>
    );
  }

  if (!fitnessData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No fitness data available</p>
        <button
          onClick={fetchFitnessData}
          className="mt-4 text-blue-500 hover:text-blue-600"
        >
          Refresh Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Steps Today</h3>
          <p className="text-3xl font-bold text-blue-500">
            {fitnessData.steps?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Calories Burned</h3>
          <p className="text-3xl font-bold text-green-500">
            {fitnessData.calories?.toLocaleString() || '0'} kcal
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Active Minutes</h3>
          <p className="text-3xl font-bold text-purple-500">
            {fitnessData.activeMinutes?.toLocaleString() || '0'} min
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
        {fitnessData.activities && fitnessData.activities.length > 0 ? (
          <div className="space-y-4">
            {fitnessData.activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{activity.type}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(activity.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{activity.duration} min</p>
                  <p className="text-sm text-gray-600">{activity.calories} kcal</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No recent activities</p>
        )}
      </div>
    </div>
  );
};

export default GoogleFitDashboard; 