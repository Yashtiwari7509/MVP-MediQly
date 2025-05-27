import { useState, useEffect } from "react";
import {
  ListPlus,
  Calendar,
  LineChart,
  FileText,
  Plus,
  X,
  Download,
  Clock,
  AlertCircle,
  Activity,
  TrendingUp,
  Thermometer,
  Stethoscope,
  History,
  CalendarDays,
  Filter,
  BarChart,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MainLayout from "@/components/layout/MainLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Symptom {
  id: string;
  name: string;
  severity: number;
  frequency: string;
  duration: string;
  notes: string;
  date: string;
}

const commonSymptoms = [
  "Fever",
  "Headache",
  "Cough",
  "Fatigue",
  "Nausea",
  "Body Ache",
  "Sore Throat",
  "Dizziness",
  "Shortness of Breath",
  "Chest Pain",
];

const Symptoms = () => {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [newSymptom, setNewSymptom] = useState<Partial<Symptom>>({
    name: "",
    severity: 1,
    frequency: "occasional",
    duration: "",
    notes: "",
  });
  const [filterDate, setFilterDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    const savedSymptoms = localStorage.getItem("symptoms");
    if (savedSymptoms) {
      setSymptoms(JSON.parse(savedSymptoms));
    }
  }, []);

  const handleSaveSymptom = () => {
    if (!newSymptom.name) return;

    const symptomToSave: Symptom = {
      id: Date.now().toString(),
      name: newSymptom.name,
      severity: newSymptom.severity || 1,
      frequency: newSymptom.frequency || "occasional",
      duration: newSymptom.duration || "",
      notes: newSymptom.notes || "",
      date: new Date().toISOString(),
    };

    const updatedSymptoms = [...symptoms, symptomToSave];
    setSymptoms(updatedSymptoms);
    localStorage.setItem("symptoms", JSON.stringify(updatedSymptoms));

    // Reset form
    setNewSymptom({
      name: "",
      severity: 1,
      frequency: "occasional",
      duration: "",
      notes: "",
    });
  };

  const handleDeleteSymptom = (id: string) => {
    const updatedSymptoms = symptoms.filter((s) => s.id !== id);
    setSymptoms(updatedSymptoms);
    localStorage.setItem("symptoms", JSON.stringify(updatedSymptoms));
  };

  const generateReport = () => {
    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter symptoms for last 30 days
    const recentSymptoms = symptoms.filter(
      (s) => new Date(s.date) >= thirtyDaysAgo
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let report = "30-Day Symptom Report\n";
    report += "===================\n\n";
    report += `Generated on: ${new Date().toLocaleDateString()}\n`;
    report += `Period: ${thirtyDaysAgo.toLocaleDateString()} to ${new Date().toLocaleDateString()}\n\n`;

    // Add summary section
    const symptomCounts: Record<string, number> = {};
    recentSymptoms.forEach((symptom) => {
      symptomCounts[symptom.name] = (symptomCounts[symptom.name] || 0) + 1;
    });

    report += "Summary\n";
    report += "-------\n";
    report += `Total Symptoms Logged: ${recentSymptoms.length}\n`;
    report += "Frequency by Symptom:\n";
    Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([name, count]) => {
        report += `- ${name}: ${count} time${count > 1 ? 's' : ''}\n`;
      });
    report += "\n";

    report += "Detailed Log\n";
    report += "-----------\n\n";

    recentSymptoms.forEach((symptom) => {
      report += `Date: ${new Date(symptom.date).toLocaleDateString()}\n`;
      report += `Symptom: ${symptom.name}\n`;
      report += `Severity: ${symptom.severity}/5\n`;
      report += `Frequency: ${symptom.frequency}\n`;
      report += `Duration: ${symptom.duration}\n`;
      report += `Notes: ${symptom.notes || "None"}\n`;
      report += "-------------------\n\n";
    });

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "30-day-symptom-report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilteredSymptoms = (days: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return symptoms.filter((s) => new Date(s.date) >= startDate);
  };

  const getDashboardMetrics = (days: number) => {
    const recentSymptoms = getFilteredSymptoms(days);
    const totalSymptoms = recentSymptoms.length;
    const uniqueSymptoms = new Set(recentSymptoms.map(s => s.name)).size;
    const severitySum = recentSymptoms.reduce((sum, s) => sum + s.severity, 0);
    const avgSeverity = totalSymptoms > 0 ? (severitySum / totalSymptoms).toFixed(1) : 0;

    const symptomFrequency = recentSymptoms.reduce((acc, s) => {
      acc[s.name] = (acc[s.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequent = totalSymptoms > 0 
      ? Object.entries(symptomFrequency).sort(([,a], [,b]) => b - a)[0][0]
      : "None";

    const severityDistribution = recentSymptoms.reduce((acc, s) => {
      acc[s.severity] = (acc[s.severity] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalSymptoms,
      uniqueSymptoms,
      avgSeverity,
      mostFrequent,
      symptomFrequency,
      severityDistribution,
    };
  };

  const metrics = getDashboardMetrics(parseInt(timeRange));

  const filteredSymptoms = filterDate
    ? symptoms.filter(
        (s) =>
          new Date(s.date).toLocaleDateString() ===
          new Date(filterDate).toLocaleDateString()
      )
    : symptoms;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Symptom Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track and analyze your symptoms over time</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <CalendarDays className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={generateReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              Export Report
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 gap-4 bg-transparent">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="log"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Log Symptoms
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Symptoms</p>
                    <h3 className="text-2xl font-bold mt-1">{metrics.totalSymptoms}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Last {timeRange} days</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Symptoms</p>
                    <h3 className="text-2xl font-bold mt-1">{metrics.uniqueSymptoms}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Different types</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Severity</p>
                    <h3 className="text-2xl font-bold mt-1">{metrics.avgSeverity}/5</h3>
                    <p className="text-xs text-muted-foreground mt-1">Last {timeRange} days</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Thermometer className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Most Frequent</p>
                    <h3 className="text-lg font-bold mt-1">{metrics.mostFrequent}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Most reported</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity and Trends */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  Symptom Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(metrics.symptomFrequency)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count]) => (
                      <div key={name} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{name}</span>
                            <span className="text-sm text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${(count / metrics.totalSymptoms) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Severity Breakdown
                </h3>
                <div className="space-y-3">
                  {Object.entries(metrics.severityDistribution)
                    .sort(([a], [b]) => parseInt(b) - parseInt(a))
                    .map(([severity, count]) => (
                      <div key={severity} className="flex items-center gap-2">
                        <Badge
                          variant={
                            parseInt(severity) >= 4
                              ? "destructive"
                              : parseInt(severity) >= 2
                              ? "secondary"
                              : "outline"
                          }
                          className="w-24"
                        >
                          Level {severity}
                        </Badge>
                        <div className="flex-1">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${(count / metrics.totalSymptoms) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count} ({Math.round((count / metrics.totalSymptoms) * 100)}%)
                        </span>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            {/* Recent Symptoms Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Recent Symptoms
              </h3>
              <div className="space-y-4">
                {symptoms.slice(0, 3).map((symptom) => (
                  <Card
                    key={symptom.id}
                    className="p-4 hover:shadow-md transition-shadow border border-border/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{symptom.name}</h3>
                          <Badge
                            variant={
                              symptom.severity >= 4
                                ? "destructive"
                                : symptom.severity >= 2
                                ? "secondary"
                                : "outline"
                            }
                            className="ml-2"
                          >
                            Severity: {symptom.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(symptom.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            {symptom.frequency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="log">
            <Card className="p-6 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <ListPlus className="h-6 w-6 text-primary" />
                Log New Symptom
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Symptom Name</Label>
                  <Select
                    value={newSymptom.name}
                    onValueChange={(value) =>
                      setNewSymptom({ ...newSymptom, name: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select or type symptom" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonSymptoms.map((symptom) => (
                        <SelectItem key={symptom} value={symptom}>
                          {symptom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Severity (1-5)</Label>
                  <Select
                    value={newSymptom.severity?.toString()}
                    onValueChange={(value) =>
                      setNewSymptom({ ...newSymptom, severity: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level} - {level === 1 ? "Mild" : level === 5 ? "Severe" : "Moderate"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={newSymptom.frequency}
                    onValueChange={(value) =>
                      setNewSymptom({ ...newSymptom, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="occasional">Occasional</SelectItem>
                      <SelectItem value="frequent">Frequent</SelectItem>
                      <SelectItem value="constant">Constant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Duration</Label>
                  <Input
                    value={newSymptom.duration}
                    onChange={(e) =>
                      setNewSymptom({ ...newSymptom, duration: e.target.value })
                    }
                    placeholder="e.g., 2 hours, all day"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newSymptom.notes}
                    onChange={(e) =>
                      setNewSymptom({ ...newSymptom, notes: e.target.value })
                    }
                    placeholder="Add any additional notes"
                    className="h-20"
                  />
                </div>

                <Button
                  onClick={handleSaveSymptom}
                  className="w-full"
                  disabled={!newSymptom.name}
                >
                  Save Symptom
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <History className="h-6 w-6 text-primary" />
                  Symptom History
                </h2>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Filter by Date:</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredSymptoms.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No symptoms logged for this period
                  </div>
                ) : (
                  filteredSymptoms.map((symptom) => (
                    <Card
                      key={symptom.id}
                      className="p-4 hover:shadow-md transition-shadow border border-border/50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{symptom.name}</h3>
                            <Badge
                              variant={
                                symptom.severity >= 4
                                  ? "destructive"
                                  : symptom.severity >= 2
                                  ? "secondary"
                                  : "outline"
                              }
                              className="ml-2"
                            >
                              Severity: {symptom.severity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(symptom.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              {symptom.frequency}
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {symptom.duration}
                            </span>
                          </div>
                          {symptom.notes && (
                            <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                              {symptom.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSymptom(symptom.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  Symptom Trends
                </h3>
                <div className="space-y-6">
                  {Object.entries(metrics.symptomFrequency)
                    .sort(([,a], [,b]) => b - a)
                    .map(([name, count]) => (
                      <div key={name} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{name}</span>
                          <span className="text-muted-foreground">
                            {count} occurrences
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(count / metrics.totalSymptoms) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((count / metrics.totalSymptoms) * 100)}% of total symptoms
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Severity Analysis
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className="text-center p-3 rounded-lg bg-muted"
                      >
                        <div className="text-2xl font-bold">
                          {metrics.severityDistribution[level] || 0}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Level {level}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Most common severity: Level {Object.entries(metrics.severityDistribution)
                        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}</li>
                      <li>• Average severity: {metrics.avgSeverity}/5</li>
                      <li>• {metrics.totalSymptoms} symptoms logged in the last {timeRange} days</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Symptoms;
