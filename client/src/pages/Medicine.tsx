import { useState, useEffect } from "react";
import {
  Plus,
  Bell,
  Calendar,
  Clock,
  Pill,
  RefreshCw,
  Trash2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import MainLayout from "@/components/layout/MainLayout";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string;
  remainingQuantity: number;
  refillThreshold: number;
  nextRefillDate: string;
}

interface Reminder {
  id: string;
  medicationId: string;
  time: string;
  taken: boolean;
}

export default function MedicinePage() {
  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem('medications');
    return saved ? JSON.parse(saved) : [];
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddingMed, setIsAddingMed] = useState(false);
  const [newMedication, setNewMedication] = useState<Partial<Medication>>({});

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('medications', JSON.stringify(medications));
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [medications, reminders]);

  // Check for notifications permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  // Check for reminders every minute
  useEffect(() => {
    const interval = setInterval(() => {
      checkReminders();
    }, 60000);

    return () => clearInterval(interval);
  }, [reminders]);

  const checkReminders = () => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);

    reminders.forEach(reminder => {
      if (reminder.time === currentTime && !reminder.taken) {
        const medication = medications.find(med => med.id === reminder.medicationId);
        if (medication) {
          sendNotification(medication.name);
        }
      }
    });
  };

  const sendNotification = (medicationName: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Medicine Reminder', {
        body: `Time to take your ${medicationName}`,
        icon: '/medicine-icon.png'
      });
    }
    toast.info(`Time to take your ${medicationName}`);
  };

  const addMedication = () => {
    if (!newMedication.name || !newMedication.dosage) {
      toast.error('Please fill in all required fields');
      return;
    }

    const medication: Medication = {
      id: Date.now().toString(),
      name: newMedication.name || '',
      dosage: newMedication.dosage || '',
      frequency: newMedication.frequency || 'daily',
      timeOfDay: newMedication.timeOfDay || '09:00',
      remainingQuantity: Number(newMedication.remainingQuantity) || 30,
      refillThreshold: Number(newMedication.refillThreshold) || 5,
      nextRefillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    setMedications(prev => [...prev, medication]);
    
    // Create reminders based on frequency
    const newReminder: Reminder = {
      id: Date.now().toString(),
      medicationId: medication.id,
      time: medication.timeOfDay,
      taken: false,
    };
    setReminders(prev => [...prev, newReminder]);

    setNewMedication({});
    setIsAddingMed(false);
    toast.success('Medication added successfully');
  };

  const takeMedication = (medicationId: string) => {
    setMedications(prev => prev.map(med => {
      if (med.id === medicationId) {
        const newQuantity = med.remainingQuantity - 1;
        // Check if refill needed
        if (newQuantity <= med.refillThreshold) {
          toast.warning(`Time to refill ${med.name}! Only ${newQuantity} doses remaining.`);
        }
        return { ...med, remainingQuantity: newQuantity };
      }
      return med;
    }));

    setReminders(prev => prev.map(rem => {
      if (rem.medicationId === medicationId) {
        return { ...rem, taken: true };
      }
      return rem;
    }));

    toast.success('Medication taken');
  };

  const deleteMedication = (id: string) => {
    setMedications(prev => prev.filter(med => med.id !== id));
    setReminders(prev => prev.filter(rem => rem.medicationId !== id));
    toast.success('Medication deleted');
  };

  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Medicine Tracker</h1>
          <Dialog open={isAddingMed} onOpenChange={setIsAddingMed}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Medication</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Medication Name"
                  value={newMedication.name || ''}
                  onChange={e => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Dosage (e.g., 50mg)"
                  value={newMedication.dosage || ''}
                  onChange={e => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                />
                <Select
                  value={newMedication.frequency || 'daily'}
                  onValueChange={value => setNewMedication(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="twice">Twice Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  value={newMedication.timeOfDay || '09:00'}
                  onChange={e => setNewMedication(prev => ({ ...prev, timeOfDay: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={newMedication.remainingQuantity || ''}
                  onChange={e => setNewMedication(prev => ({ ...prev, remainingQuantity: Number(e.target.value) }))}
                />
                <Input
                  type="number"
                  placeholder="Refill Alert Threshold"
                  value={newMedication.refillThreshold || ''}
                  onChange={e => setNewMedication(prev => ({ ...prev, refillThreshold: Number(e.target.value) }))}
                />
                <Button onClick={addMedication} className="w-full">
                  Add Medication
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map(medication => (
            <Card key={medication.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Pill className="h-5 w-5 mr-2 text-primary" />
                  {medication.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => deleteMedication(medication.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dosage:</span>
                  <span>{medication.dosage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <span>{medication.timeOfDay}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Remaining:</span>
                  <Badge variant={medication.remainingQuantity <= medication.refillThreshold ? "destructive" : "secondary"}>
                    {medication.remainingQuantity} doses
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Refill:</span>
                  <span>{new Date(medication.nextRefillDate).toLocaleDateString()}</span>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => takeMedication(medication.id)}
                  disabled={reminders.find(r => r.medicationId === medication.id)?.taken}
                >
                  {reminders.find(r => r.medicationId === medication.id)?.taken ? 'Taken' : 'Take Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {medications.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Pill className="h-8 w-8 mx-auto mb-4" />
              <p>No medications added yet. Click "Add Medication" to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
