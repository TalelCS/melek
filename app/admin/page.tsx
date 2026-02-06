"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scissors, Users, Clock, AlertCircle, Check, SkipForward, Play, Pause, RefreshCw, PhoneCall, Lightbulb } from 'lucide-react';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction, collection, query, where, orderBy, limit, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ===== COMPONENT 1: HEADER WITH STATUS =====
function AdminHeader({ queueOpen, onToggleQueue }) {
  return (
    <div className="bg-slate-900 shadow-xl border-b-4 border-amber-500">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scissors className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Melek Coiff</h1>
              <p className="text-xs text-slate-400">Admin Dashboard</p>
            </div>
          </div>
          
          <button
            onClick={onToggleQueue}
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
              queueOpen
                ? 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600'
                : 'bg-red-500 text-white shadow-lg hover:bg-red-600'
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
function QueueControls({ queueOpen, currentPosition, hasWaitingClients, onToggleQueue, onStartService, onResetQueue, loading }) {
  return (
    <Card className="shadow-md bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            onClick={onToggleQueue}
            className={`h-14 text-base font-semibold ${
              queueOpen
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
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
            disabled={loading || currentPosition > 0 || !hasWaitingClients}
            className="h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Service
          </Button>
        </div>
        
        <Button
          onClick={onResetQueue}
          variant="outline"
          className="w-full h-12 text-base font-semibold border-2 border-red-400/50 text-red-400 hover:bg-red-500/10"
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
      <Card className="shadow-lg border-2 border-slate-700 bg-slate-800">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No one being served</p>
          <p className="text-slate-500 text-sm mt-2">Press "Start Service" to begin</p>
        </CardContent>
      </Card>
    );
  }
  
  const fullName = `${client.firstName} ${client.lastName}`;
  const skipCount = client.skipCount || 0;
  
  return (
    <Card className="shadow-lg border-4 border-blue-500 bg-gradient-to-br from-slate-800 to-slate-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-sm text-blue-400 font-semibold flex items-center justify-center gap-2">
          NOW SERVING
          {skipCount > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
              Skipped {skipCount}x
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="text-center mb-4">
          <div className="text-7xl font-bold text-white mb-2">
            #{client.number}
          </div>
          <div className="text-3xl font-semibold text-slate-200">
            {fullName}
          </div>
          <div className="text-lg text-amber-400 mt-2 flex items-center justify-center gap-2">
            <PhoneCall className="w-5 h-5" />
            {client.phoneNumber}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Button
            onClick={onDone}
            disabled={loading}
            className="h-16 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check className="w-6 h-6 mr-2" />
            {loading ? 'Processing...' : 'Done'}
          </Button>
          
          <Button
            onClick={onSkip}
            disabled={loading}
            variant="outline"
            className={`h-16 text-lg font-bold border-2 disabled:opacity-50 ${
              skipCount >= 2 
                ? 'border-red-500 text-red-400 hover:bg-red-500/10' 
                : 'border-amber-500 text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <SkipForward className="w-6 h-6 mr-2" />
            {loading ? '...' : skipCount >= 2 ? 'Remove' : 'Skip'}
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
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Waiting List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8">No one waiting</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-md bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-white">
          <Users className="w-5 h-5" />
          Waiting List ({clients.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {clients.map((client) => {
            const fullName = `${client.firstName} ${client.lastName}`;
            const skipCount = client.skipCount || 0;
            return (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-amber-400 w-16">
                    #{client.number}
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-white flex items-center gap-2">
                      {fullName}
                      {skipCount > 0 && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                          {skipCount}x skipped
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 flex items-center gap-2">
                      <PhoneCall className="w-4 h-4" />
                      {client.phoneNumber}
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => onCallClient(client)}
                  disabled={loading}
                  variant="outline"
                  className="h-12 px-6 border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10 font-semibold disabled:opacity-50"
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
    <Card className="bg-slate-800 border-slate-700 shadow-md">
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-4xl font-bold text-white mb-1">
              {waiting}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              Waiting
            </div>
          </div>
          
          <div>
            <div className="text-4xl font-bold text-white mb-1">
              {avgServiceTime}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Avg (min)
            </div>
          </div>
          
          <div>
            <div className="text-4xl font-bold text-white mb-1">
              ~{estimatedTotal}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
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
  const [currentPosition, setCurrentPosition] = useState(0); // Current position being served
  const [lastNumber, setLastNumber] = useState(0); // Last ticket number issued
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
            currentPosition: 0,
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
        setCurrentPosition(data.currentPosition ?? 0);
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
    if (currentPosition === 0) {
      setCurrentClient(null);
      return;
    }
    
    const q = query(
      collection(db, "queues", "today", "clients"),
      where("position", "==", currentPosition),
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
  }, [currentPosition]);
  
  // ===== LISTEN TO ALL WAITING CLIENTS (for stats) =====
  useEffect(() => {
    const q = query(
      collection(db, "queues", "today", "clients"),
      where("status", "==", "waiting"),
      orderBy("position", "asc")
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
      where("position", ">", currentPosition),
      orderBy("position", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWaitingClients(clients);
    });
    
    return () => unsubscribe();
  }, [currentPosition]);
  
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
    if (actionLoading || currentPosition > 0 || allWaitingClients.length === 0) return;
    
    try {
      setActionLoading(true);
      
      const queueRef = doc(db, "queues", "today");
      
      await updateDoc(queueRef, {
        currentPosition: 1,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Service started with position #1');
      
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
      
      const clientsSnapshot = await getDocs(clientsRef);
      
      const batch = writeBatch(db);
      
      clientsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      batch.update(queueRef, {
        currentPosition: 0,
        lastNumber: 0,
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
      
      setCurrentClient(null);
      setWaitingClients([]);
      setAllWaitingClients([]);
      
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
        transaction.update(clientRef, {
          status: "done",
          completedAt: serverTimestamp()
        });
        
        transaction.update(queueRef, {
          currentPosition: currentPosition + 1,
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
    const skipCount = currentClient.skipCount || 0;
    
    // 3rd skip = remove from queue
    if (skipCount >= 2) {
      if (!confirm(`⚠️ Remove ${fullName} from queue? (3rd skip - marked as no-show)`)) return;
      
      try {
        setActionLoading(true);
        
        const queueRef = doc(db, "queues", "today");
        const clientRef = doc(db, "queues", "today", "clients", currentClient.id);
        
        await runTransaction(db, async (transaction) => {
          transaction.update(clientRef, {
            status: "no_show",
            removedAt: serverTimestamp()
          });
          
          transaction.update(queueRef, {
            currentPosition: currentPosition + 1,
            updatedAt: serverTimestamp()
          });
        });
        
        console.log(`❌ ${fullName} marked as no-show (3rd skip)`);
        alert(`❌ ${fullName} removed from queue (no-show)`);
        
      } catch (error) {
        console.error('❌ Failed to remove client:', error);
        alert('Failed to remove client. Please try again.');
      } finally {
        setActionLoading(false);
      }
      return;
    }
    
    // 1st or 2nd skip = move back by 1 position
    if (!confirm(`⚠️ Skip ${fullName}? They will move back by 1 position. (Skip ${skipCount + 1}/3)`)) return;
    
    try {
      setActionLoading(true);
      
      const queueRef = doc(db, "queues", "today");
      const clientRef = doc(db, "queues", "today", "clients", currentClient.id);
      
      // Get the next waiting client by position
      const nextClientQuery = query(
        collection(db, "queues", "today", "clients"),
        where("status", "==", "waiting"),
        where("position", ">", currentPosition),
        orderBy("position", "asc"),
        limit(1)
      );
      
      const nextClientSnapshot = await getDocs(nextClientQuery);
      
      if (nextClientSnapshot.empty) {
        alert('⚠️ No one else in queue to swap with!');
        setActionLoading(false);
        return;
      }
      
      const nextClient = nextClientSnapshot.docs[0];
      const nextClientRef = doc(db, "queues", "today", "clients", nextClient.id);
      const nextClientData = nextClient.data();
      const nextClientPosition = nextClientData.position;
      const nextClientFullName = `${nextClientData.firstName} ${nextClientData.lastName}`;
      
      await runTransaction(db, async (transaction) => {
        // Current client moves back by 1 position (position changes, number stays)
        transaction.update(clientRef, {
          position: nextClientPosition,
          skipCount: skipCount + 1,
          lastSkippedAt: serverTimestamp()
        });
        
        // Next client moves forward to current position
        transaction.update(nextClientRef, {
          position: currentPosition
        });
        
        // Queue stays at current position (now serving the next person)
        transaction.update(queueRef, {
          updatedAt: serverTimestamp()
        });
      });
      
      console.log(`⚠️ ${fullName} #${currentClient.number} (${skipCount + 1}/3 skips) swapped position with ${nextClientFullName} #${nextClientData.number}`);
      
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
    
    const telLink = `tel:${phoneNumber}`;
    window.location.href = telLink;
    
    console.log(`📢 Calling ${fullName} at ${phoneNumber}`);
  };
  
  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="w-12 h-12 text-amber-400 animate-pulse mx-auto mb-4" />
          <p className="text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminHeader queueOpen={queueOpen} onToggleQueue={handleToggleQueue} />
      
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <QueueControls
          queueOpen={queueOpen}
          currentPosition={currentPosition}
          hasWaitingClients={allWaitingClients.length > 0}
          onToggleQueue={handleToggleQueue}
          onStartService={handleStartService}
          onResetQueue={handleResetQueue}
          loading={actionLoading}
        />
        
        <CurrentClient
          client={currentClient}
          onDone={handleDone}
          onSkip={handleSkip}
          onCall={handleCallClient}
          loading={actionLoading}
        />
        
        <QuickStats
          waiting={waitingCount}
          avgServiceTime={avgServiceTime}
          estimatedTotal={estimatedTotal}
        />
        
        <WaitingList
          clients={waitingClients}
          onCallClient={handleCallClient}
          loading={actionLoading}
        />
        
        <Alert className="bg-slate-800/50 border-slate-700">
          <Lightbulb className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-slate-300 text-sm">
            <strong>Skip Logic:</strong> 1st & 2nd skip = move back 1 position (ticket # stays same). 3rd skip = remove (no-show).
          </AlertDescription>
        </Alert>
        
        <div className="bg-slate-900 text-white p-3 rounded text-xs font-mono border border-slate-800">
          <div>Current Position: #{currentPosition} | Last Ticket: #{lastNumber}</div>
          <div>Total Waiting: {waitingCount} | Next Waiting: {waitingClients.length}</div>
          <div>Avg: {avgServiceTime}min | Est Total: ~{estimatedTotal}min</div>
        </div>
      </div>
    </div>
  );
}