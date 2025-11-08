"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser, useUsers } from '@/lib/hooks';
import { AdminPanel } from '@/components/AdminPanel';
import { UserDashboard } from '@/components/UserDashboard';
import { UserLogin } from '@/components/UserLogin';
import { AppInitializer } from '@/components/AppInitializer';
import { Dumbbell, Heart, Target, Users } from 'lucide-react';

export default function Home() {
  const { currentUser, isLoggedIn, isAdmin } = useCurrentUser();

  return (
    <AppInitializer>
      {!isLoggedIn ? (
        <UserLogin />
      ) : isAdmin ? (
        <AdminPanel />
      ) : (
        <UserDashboard />
      )}
    </AppInitializer>
  );
}