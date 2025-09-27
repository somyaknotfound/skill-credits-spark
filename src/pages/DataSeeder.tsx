import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Users, 
  BookOpen, 
  TrendingUp, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { seedData, clearData, getSeedingStats } from '@/utils/dataSeeder';

const DataSeeder = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [stats, setStats] = useState(getSeedingStats());
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setProgress(0);
    setLogs([]);
    
    try {
      addLog('🌱 Starting data seeding process...');
      setProgress(10);
      
      // Override console.log to capture logs
      const originalLog = console.log;
      console.log = (...args) => {
        addLog(args.join(' '));
        originalLog(...args);
      };
      
      await seedData();
      
      console.log = originalLog;
      
      setProgress(100);
      addLog('✅ Data seeding completed successfully!');
      setStats(getSeedingStats());
      
    } catch (error: any) {
      addLog(`❌ Error during seeding: ${error.message}`);
      console.error('Seeding error:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    setLogs([]);
    
    try {
      addLog('🧹 Starting data clearing process...');
      
      const originalLog = console.log;
      console.log = (...args) => {
        addLog(args.join(' '));
        originalLog(...args);
      };
      
      await clearData();
      
      console.log = originalLog;
      
      addLog('✅ Data clearing completed successfully!');
      setStats(getSeedingStats());
      
    } catch (error: any) {
      addLog(`❌ Error during clearing: ${error.message}`);
      console.error('Clearing error:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleRefreshStats = () => {
    setStats(getSeedingStats());
    addLog('📊 Stats refreshed');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-3">
            <Database className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Data Seeder
            </h1>
            <Database className="h-12 w-12 text-primary" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Development utility to populate realistic test data for the SkillSwap platform.
            Perfect for testing leaderboards, transactions, and user interactions.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.users}</div>
              <div className="text-sm text-muted-foreground">User Profiles</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.skills}</div>
              <div className="text-sm text-muted-foreground">Skills Available</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold">{stats.listings}</div>
              <div className="text-sm text-muted-foreground">Course Listings</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            onClick={handleSeedData}
            disabled={isSeeding || isClearing}
            size="lg"
            className="animate-pulse-glow"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Seeding Data...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Seed Test Data
              </>
            )}
          </Button>
          
          <Button
            onClick={handleClearData}
            disabled={isSeeding || isClearing}
            variant="destructive"
            size="lg"
          >
            {isClearing ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Clearing Data...
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 mr-2" />
                Clear All Data
              </>
            )}
          </Button>
          
          <Button
            onClick={handleRefreshStats}
            disabled={isSeeding || isClearing}
            variant="outline"
            size="lg"
          >
            <Activity className="h-5 w-5 mr-2" />
            Refresh Stats
          </Button>
        </div>

        {/* Progress Bar */}
        {isSeeding && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Seeding Progress</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Creating users, skills, transactions, and progress data...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* What Gets Created */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-accent" />
              <span>What Gets Created</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-500">User Data</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 15 diverse user profiles with avatars</li>
                  <li>• Random credit balances (100-600 credits)</li>
                  <li>• Varied skill levels (1-10)</li>
                  <li>• Realistic usernames and emails</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-500">Course Data</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 20 skills across multiple categories</li>
                  <li>• 10 active course listings</li>
                  <li>• Varied difficulty levels and pricing</li>
                  <li>• Realistic course descriptions</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-500">Transaction Data</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 1-3 students per course</li>
                  <li>• Purchase and teaching transactions</li>
                  <li>• Random dates over last 90 days</li>
                  <li>• Proper credit balance updates</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-500">Progress & Reviews</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Course progress tracking (0-100%)</li>
                  <li>• Student reviews and ratings</li>
                  <li>• Completion timestamps</li>
                  <li>• Realistic feedback messages</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-accent" />
              <span>Operation Logs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/20 rounded-lg p-4 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No operations performed yet. Click "Seed Test Data" to start.
                </p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="mt-8 border-destructive/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-destructive mt-1" />
              <div>
                <h3 className="font-semibold text-destructive mb-2">Development Only</h3>
                <p className="text-sm text-muted-foreground">
                  This tool is for development and testing purposes only. 
                  Do not use in production environments. The "Clear All Data" 
                  button will remove all seeded data from the database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataSeeder;
