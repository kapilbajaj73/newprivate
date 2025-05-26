import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Database, HardDrive } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function StorageModeToggle() {
  const [isInMemory, setIsInMemory] = useState<boolean>(localStorage.getItem('USE_MEMORY_STORAGE') === 'true');
  const [showReloadAlert, setShowReloadAlert] = useState<boolean>(false);

  useEffect(() => {
    // Update state if localStorage changes
    const memoryMode = localStorage.getItem('USE_MEMORY_STORAGE') === 'true';
    setIsInMemory(memoryMode);
  }, []);

  const handleToggle = (checked: boolean) => {
    localStorage.setItem('USE_MEMORY_STORAGE', checked ? 'true' : 'false');
    setIsInMemory(checked);
    setShowReloadAlert(true);
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isInMemory ? (
            <HardDrive className="h-5 w-5 text-blue-500" />
          ) : (
            <Database className="h-5 w-5 text-purple-500" />
          )}
          Storage Mode
        </CardTitle>
        <CardDescription>
          Choose between in-memory storage (for standalone use) or PostgreSQL database (for server-backed use).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="memory-mode"
            checked={isInMemory}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="memory-mode" className="font-medium">
            {isInMemory ? 'In-Memory Storage (Standalone)' : 'PostgreSQL Database (Server)'}
          </Label>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {isInMemory ? (
            <p>Using in-memory storage. Data will be reset when the app is restarted. Ideal for standalone APK usage.</p>
          ) : (
            <p>Using PostgreSQL database. Data will persist across sessions and be shared between all connected clients.</p>
          )}
        </div>

        {showReloadAlert && (
          <Alert className="mt-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Storage mode changed</AlertTitle>
            <AlertDescription>
              You need to reload the application for changes to take effect.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        {showReloadAlert && (
          <Button onClick={handleReload} className="w-full">
            Reload Application
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default StorageModeToggle;