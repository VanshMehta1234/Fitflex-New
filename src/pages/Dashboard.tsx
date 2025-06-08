import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className="container px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-2">Workout Statistics</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              View detailed workout statistics and trends.
            </p>
            <Button onClick={() => navigate('/analytics/workouts')}>
              View Details
            </Button>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-2">Nutrition Tracking</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Track your meals and calorie intake.
            </p>
            <Button onClick={() => navigate('/analytics/nutrition')}>
              View Details
            </Button>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-2">Progress Reports</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Generate detailed progress reports.
            </p>
            <Button onClick={() => navigate('/analytics/reports')}>
              View Details
            </Button>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-500 dark:text-gray-400">
            More analytics features coming soon!
          </p>
        </div>
      </div>
    </MainLayout>
  );
} 