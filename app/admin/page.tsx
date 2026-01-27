"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scissors, Users, Clock, AlertCircle, Check, SkipForward, Play, Pause, RefreshCw, PhoneCall } from 'lucide-react';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction, collection, query, where, orderBy, limit, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ===== COMPONENT 1: HEADER WITH STATUS =====
function AdminHeader({ queueOpen, onToggleQueue }) {
  return (
    <div className="bg-white shadow-md border-b-4 border-slate-800">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scissors className="w-8 h-8 text-slate-700" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Barber Elite</h1>
              <p className="text-xs text-slate-500">Admin Dashboard</p>
            </div>
          </div>
          
          <button
            onClick={onToggleQueue}
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
              queueOpen
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-red-500 text-white shadow-lg'
            }`}
          >
            {queueOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENT 2: QUEUE CONTROLS =====
function QueueControls({ queueOpen, currentNumber, hasWaitingClients, onToggleQueue, onStartService, onResetQueue, loading }) {
  return (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            onClick={onToggleQueue}
            className={`h-14 text-base font-semibold ${
              queueOpen
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {queueOpen ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Close Queue
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Open Queue
              </>
            )}
          </Button>
          
          <Button
            onClick={onStartService}
            disabled={loading || currentNumber > 0 || !hasWaitingClients}
            className="h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Service
          </Button>
        </div>
        
        <Button
          onClick={onResetQueue}
          variant="outline"
          className="w-full h-12 text-base font-semibold border-2 border-red-300 text-red-600 hover:bg-red-50"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Reset Day
        </Button>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 3: CURRENT CLIENT (BIG) =====
function CurrentClient({ client, onDone, onSkip, onCall, loading }) {
  if (!client) {
    return (
      <Card className="shadow-lg border-2 border-slate-300">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No one being served</p>
          <p className="text-slate-300 text-sm mt-2">Press "Start Service" to begin</p>
        </CardContent>
      </Card>
    );
  }
  
  const fullName = `${client.firstName} ${client.lastName}`;
  
  return (
    <Card className="shadow-lg border-4 border-blue-500 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-sm text-blue-600 font-semibold">
          NOW SERVING
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="text-center mb-4">
          <div className="text-7xl font-bold text-slate-800 mb-2">
            #{client.number}
          </div>
          <div className="text-3xl font-semibold text-slate-700">
            {fullName}
          </div>
          <div className="text-lg text-slate-500 mt-2">
            📱 {client.phoneNumber}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Button
            onClick={onDone}
            disabled={loading}
            className="h-16 text-lg font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="w-6 h-6 mr-2" />
            {loading ? 'Processing...' : 'Done'}
          </Button>
          
          <Button
            onClick={onSkip}
            disabled={loading}
            variant="outline"
            className="h-16 text-lg font-bold border-2 border-amber-400 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
          >
            <SkipForward className="w-6 h-6 mr-2" />
            {loading ? 'Processing...' : 'Skip'}
          </Button>
          
          <Button
            onClick={() => onCall(client)}
            disabled={loading}
            className="h-16 text-lg font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <PhoneCall className="w-6 h-6 mr-2" />
            Call
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 4: WAITING LIST =====
function WaitingList({ clients, onCallClient, loading }) {
  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Waiting List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8">No one waiting</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Waiting List ({clients.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {clients.map((client) => {
            const fullName = `${client.firstName} ${client.lastName}`;
            return (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-slate-700 w-16">
                    #{client.number}
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-slate-800">
                      {fullName}
                    </div>
                    <div className="text-sm text-slate-500">
                      📱 {client.phoneNumber}
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => onCallClient(client)}
                  disabled={loading}
                  variant="outline"
                  className="h-12 px-6 border-2 border-blue-400 text-blue-600 hover:bg-blue-50 font-semibold disabled:opacity-50"
                >
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Call
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 5: QUICK STATS =====
function QuickStats({ waiting, avgServiceTime, estimatedTotal }) {
  return (
    <Card className="bg-slate-50 border-slate-200 shadow-md">
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-4xl font-bold text-slate-800 mb-1">
              {waiting}
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              Waiting
            </div>
          </div>
          
          <div>
            <div className="text-4xl font-bold text-slate-800 mb-1">
              {avgServiceTime}
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Avg (min)
            </div>
          </div>
          
          <div>
            <div className="text-4xl font-bold text-slate-800 mb-1">
              ~{estimatedTotal}
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Total (min)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== MAIN ADMIN COMPONENT =====
export default function BarberQueueAdmin() {
  // ===== STATE =====
  const [queueOpen, setQueueOpen] = useState(true);
  const [currentNumber, setCurrentNumber] = useState(0);
  const [lastNumber, setLastNumber] = useState(0);
  const [avgServiceTime, setAvgServiceTime] = useState(15);
  const [currentClient, setCurrentClient] = useState(null);
  const [waitingClients, setWaitingClients] = useState([]);
  const [allWaitingClients, setAllWaitingClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // ===== COMPUTED VALUES =====
  const waitingCount = allWaitingClients.length;
  const estimatedTotal = waitingCount * avgServiceTime;
  
  // ===== INITIALIZE QUEUE =====
  useEffect(() => {
    const initQueue = async () => {
      const queueRef = doc(db, "queues", "today");
      const queueSnap = await getDoc(queueRef);
    
      if (!queueSnap.exists()) {
        try {
          await setDoc(queueRef, {
            queueOpen: true,
            currentNumber: 0,
            lastNumber: 0,
            avgServiceTime: 15,
            updatedAt: serverTimestamp(),
          });
          console.log("✅ Queue initialized");
        } catch (error) {
          console.error("❌ Failed to initialize queue:", error);
        }
      }
    };
    
    initQueue();
  }, []);

  // ===== LISTEN TO QUEUE STATUS =====
  useEffect(() => {
    const queueRef = doc(db, "queues", "today");
  
    const unsubscribe = onSnapshot(
      queueRef,
      (snap) => {
        if (!snap.exists()) {
          console.warn("⚠️ Queue document does not exist");
          return;
        }
  
        const data = snap.data();
  
        setQueueOpen(data.queueOpen ?? true);
        setCurrentNumber(data.currentNumber ?? 0);
        setLastNumber(data.lastNumber ?? 0);
        setAvgServiceTime(data.avgServiceTime ?? 15);
  
        setLoading(false);
      },
      (error) => {
        console.error("❌ Queue listener error:", error);
        setLoading(false);
      }
    );
  
    return () => unsubscribe();
  }, []);
  
  // ===== LISTEN TO CURRENT CLIENT =====
  useEffect(() => {
    if (currentNumber === 0) {
      setCurrentClient(null);
      return;
    }
    
    const q = query(
      collection(db, "queues", "today", "clients"),
      where("number", "==", currentNumber),
      where("status", "==", "waiting")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setCurrentClient(null);
      } else {
        const clientDoc = snapshot.docs[0];
        setCurrentClient({
          id: clientDoc.id,
          ...clientDoc.data()
        });
      }
    });
    
    return () => unsubscribe();
  }, [currentNumber]);
  
  // ===== LISTEN TO ALL WAITING CLIENTS (for stats) =====
  useEffect(() => {
    const q = query(
      collection(db, "queues", "today", "clients"),
      where("status", "==", "waiting"),
      orderBy("number", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllWaitingClients(clients);
    });
    
    return () => unsubscribe();
  }, []);
  
  // ===== LISTEN TO WAITING LIST (excluding current) =====
  useEffect(() => {
    const q = query(
      collection(db, "queues", "today", "clients"),
      where("status", "==", "waiting"),
      where("number", ">", currentNumber),
      orderBy("number", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWaitingClients(clients);
    });
    
    return () => unsubscribe();
  }, [currentNumber]);
  
  // ===== ACTIONS =====
  const handleToggleQueue = async () => {
    const action = queueOpen ? 'close' : 'open';
    if (!confirm(`Are you sure you want to ${action} the queue?`)) return;
    
    try {
      const queueRef = doc(db, "queues", "today");
      await updateDoc(queueRef, {
        queueOpen: !queueOpen,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Queue ${action}ed`);
    } catch (error) {
      console.error(`❌ Failed to ${action} queue:`, error);
      alert(`Failed to ${action} queue. Please try again.`);
    }
  };
  
  const handleStartService = async () => {
    if (actionLoading || currentNumber > 0 || allWaitingClients.length === 0) return;
    
    try {
      setActionLoading(true);
      
      const queueRef = doc(db, "queues", "today");
      
      // Start with client #1
      await updateDoc(queueRef, {
        currentNumber: 1,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Service started with client #1');
      
    } catch (error) {
      console.error('❌ Failed to start service:', error);
      alert('Failed to start service. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleResetQueue = async () => {
    if (!confirm('⚠️ This will reset the entire queue. Are you sure?')) return;
    if (!confirm('⚠️⚠️ FINAL WARNING: This cannot be undone!')) return;
    
    try {
      setActionLoading(true);
      
      const queueRef = doc(db, "queues", "today");
      const clientsRef = collection(db, "queues", "today", "clients");
      
      // Get all clients
      const clientsSnapshot = await getDocs(clientsRef);
      
      // Create batch to delete all clients
      const batch = writeBatch(db);
      
      clientsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Reset queue counters
      batch.update(queueRef, {
        currentNumber: 0,
        lastNumber: 0,
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
      
      console.log('✅ Queue reset successfully');
      alert('✅ Queue reset successfully!');
      
    } catch (error) {
      console.error('❌ Failed to reset queue:', error);
      alert('Failed to reset queue. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleDone = async () => {
    if (!currentClient || actionLoading) return;
    
    try {
      setActionLoading(true);
      
      const queueRef = doc(db, "queues", "today");
      const clientRef = doc(db, "queues", "today", "clients", currentClient.id);
      
      await runTransaction(db, async (transaction) => {
        // Mark client as done
        transaction.update(clientRef, {
          status: "done",
          completedAt: serverTimestamp()
        });
        
        // Move to next client in queue
        transaction.update(queueRef, {
          currentNumber: currentNumber + 1,
          updatedAt: serverTimestamp()
        });
      });
      
      console.log(`✅ ${currentClient.firstName} ${currentClient.lastName} marked as done`);
      
    } catch (error) {
      console.error('❌ Failed to mark as done:', error);
      alert('Failed to complete action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleSkip = async () => {
    if (!currentClient || actionLoading) return;
    
    const fullName = `${currentClient.firstName} ${currentClient.lastName}`;
    
    if (!confirm(`⚠️ Skip ${fullName}? They will be moved behind the next person in line.`)) return;
    
    try {
      setActionLoading(true);
      
      const queueRef = doc(db, "queues", "today");
      const clientRef = doc(db, "queues", "today", "clients", currentClient.id);
      
      // Get the next waiting client
      const nextClientQuery = query(
        collection(db, "queues", "today", "clients"),
        where("status", "==", "waiting"),
        where("number", ">", currentNumber),
        orderBy("number", "asc")
      );
      
      const nextClientSnapshot = await getDocs(nextClientQuery);
      
      if (nextClientSnapshot.empty) {
        alert('⚠️ No one else in queue to swap with!');
        setActionLoading(false);
        return;
      }
      
      const nextClient = nextClientSnapshot.docs[0];
      const nextClientRef = doc(db, "queues", "today", "clients", nextClient.id);
      const nextClientNumber = nextClient.data().number;
      const nextClientFullName = `${nextClient.data().firstName} ${nextClient.data().lastName}`;
      
      await runTransaction(db, async (transaction) => {
        // Current client takes next client's number
        transaction.update(clientRef, {
          number: nextClientNumber,
          skippedAt: serverTimestamp()
        });
        
        // Next client takes current client's number
        transaction.update(nextClientRef, {
          number: currentNumber
        });
        
        // Queue doesn't move forward - it stays at current number
        transaction.update(queueRef, {
          updatedAt: serverTimestamp()
        });
      });
      
      console.log(`⚠️ ${fullName} swapped with ${nextClientFullName}`);
      alert(`⚠️ ${fullName} (#${currentNumber}) is now #${nextClientNumber}\n${nextClientFullName} (#${nextClientNumber}) is now #${currentNumber}`);
      
    } catch (error) {
      console.error('❌ Failed to skip:', error);
      alert('Failed to skip client. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleCallClient = async (client) => {
    if (actionLoading) return;
    
    const fullName = `${client.firstName} ${client.lastName}`;
    const phoneNumber = client.phoneNumber;
    
    // Create tel: link for calling
    const telLink = `tel:${phoneNumber}`;
    
    // Open phone dialer
    window.location.href = telLink;
    
    console.log(`📢 Calling ${fullName} at ${phoneNumber}`);
  };
  
  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="w-12 h-12 text-slate-400 animate-pulse mx-auto mb-4" />
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <AdminHeader queueOpen={queueOpen} onToggleQueue={handleToggleQueue} />
      
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Queue Controls */}
        <QueueControls
          queueOpen={queueOpen}
          currentNumber={currentNumber}
          hasWaitingClients={allWaitingClients.length > 0}
          onToggleQueue={handleToggleQueue}
          onStartService={handleStartService}
          onResetQueue={handleResetQueue}
          loading={actionLoading}
        />
        
        {/* Current Client - BIG */}
        <CurrentClient
          client={currentClient}
          onDone={handleDone}
          onSkip={handleSkip}
          onCall={handleCallClient}
          loading={actionLoading}
        />
        
        {/* Quick Stats */}
        <QuickStats
          waiting={waitingCount}
          avgServiceTime={avgServiceTime}
          estimatedTotal={estimatedTotal}
        />
        
        {/* Waiting List */}
        <WaitingList
          clients={waitingClients}
          onCallClient={handleCallClient}
          loading={actionLoading}
        />
        
        {/* Footer Info */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            💡 <strong>Workflow:</strong> Press "Start Service" to begin. Tap "Done" after each client. Use "Call" to dial client's phone number.
          </AlertDescription>
        </Alert>
        
        {/* Debug Info */}
        <div className="bg-slate-800 text-white p-3 rounded text-xs font-mono">
          <div>Current: #{currentNumber} | Last: #{lastNumber}</div>
          <div>Total Waiting: {waitingCount} | Next Waiting: {waitingClients.length}</div>
          <div>Avg: {avgServiceTime}min | Est Total: ~{estimatedTotal}min</div>
        </div>
      </div>
    </div>
  );
}