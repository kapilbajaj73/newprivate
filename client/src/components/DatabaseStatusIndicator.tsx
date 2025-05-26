import React, { useEffect, useState } from 'react';
import { Database, HardDrive } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function DatabaseStatusIndicator() {
  const [isUsingMemory, setIsUsingMemory] = useState<boolean>(true);
  const [dbUsers, setDbUsers] = useState<number | null>(null);
  
  useEffect(() => {
    // Check localStorage for storage mode
    const memoryMode = localStorage.getItem('USE_MEMORY_STORAGE') === 'true';
    setIsUsingMemory(memoryMode);
    
    // Fetch user count from database
    fetchUserCount();
  }, []);
  
  const fetchUserCount = async () => {
    try {
      const response = await fetch('/api/users/count');
      if (response.ok) {
        const data = await response.json();
        setDbUsers(data.count);
      }
    } catch (error) {
      console.error('Error fetching user count:', error);
    }
  };
  
  const toggleStorageMode = () => {
    const newMode = !isUsingMemory;
    localStorage.setItem('USE_MEMORY_STORAGE', newMode ? 'true' : 'false');
    setIsUsingMemory(newMode);
    // Reload to apply the change
    window.location.reload();
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {isUsingMemory ? (
            <HardDrive className="h-5 w-5 text-blue-500" />
          ) : (
            <Database className="h-5 w-5 text-purple-500" />
          )}
          Storage Mode
        </CardTitle>
        <CardDescription>
          Currently using: 
          <Badge variant={isUsingMemory ? "outline" : "default"} className="ml-2">
            {isUsingMemory ? 'In-Memory Storage' : 'PostgreSQL Database'}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="text-sm">
            {isUsingMemory ? (
              <p>In-memory mode is enabled. All data is stored locally and will be reset when the app restarts.</p>
            ) : (
              <p>Database mode is enabled. All data is stored in PostgreSQL and persists across sessions.</p>
            )}
            {!isUsingMemory && dbUsers !== null && (
              <p className="mt-2 text-muted-foreground">Database has {dbUsers} users.</p>
            )}
          </div>
          <Button onClick={toggleStorageMode} variant="outline" size="sm">
            Switch to {isUsingMemory ? 'Database' : 'In-Memory'} Mode
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DatabaseStatusIndicator;