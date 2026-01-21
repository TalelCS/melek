"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scissors, Clock, Users, AlertCircle } from 'lucide-react';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, increment, serverTimestamp, runTransaction } from 'firebase/firestore';
import { collection, query, where, onSnapshot as onSnapshotCollection } from 'firebase/firestore';
import InstallPWA from '@/components/installPWA';
import NotificationPrompt from '@/components/NotificationPrompt';
import { QueueNotifications, canSendNotifications } from '@/lib/notifications';
import { db } from '@/lib/firebase';

// ===== COMPONENT 1: STATUS BANNER =====
function StatusBanner({ queueOpen, inQueue, isNext, isAlmostNext }) {
  const getStatus = () => {
    if (!queueOpen) {
      return {
        icon: '🔴',
        text: 'Queue is closed',
        className: 'bg-red-50 border-red-200 text-red-800'
      };
    }
    
    if (isNext) {
      return {
        icon: '🔵',
        text: "You're being served - Please come to the shop!",
        className: 'bg-blue-50 border-blue-200 text-blue-800'
      };
    }
    
    if (isAlmostNext) {
      return {
        icon: '🟡',
        text: 'Almost your turn - Please come to the shop',
        className: 'bg-yellow-50 border-yellow-200 text-yellow-800'
      };
    }
    
    return {
      icon: '🟢',
      text: 'Queue is open - Join now',
      className: 'bg-green-50 border-green-200 text-green-800'
    };
  };
  
  const status = getStatus();
  
  return (
    <Alert className={status.className}>
      <AlertDescription className="text-center font-medium">
        {status.icon} {status.text}
      </AlertDescription>
    </Alert>
  );
}

// ===== COMPONENT 2: JOIN QUEUE FORM =====
function JoinQueueForm({ userName, setUserName, queueOpen, onJoin }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (userName.trim() && queueOpen) {
      onJoin();
    }
  };
  
  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-xl">
          Join Today's Queue
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Your Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="text-lg h-12"
              disabled={!queueOpen}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!userName.trim() || !queueOpen}
            className="w-full h-14 text-lg font-semibold bg-slate-800 hover:bg-slate-700"
          >
            Join Queue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 3: QUEUE STATUS =====
function QueueStatus({ userName, userPosition, peopleAhead, estimatedWait, onLeave }) {
  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-xl">
          You're in the queue ✅
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Queue Position - Big Number */}
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-1">Your number</p>
            <div className="text-6xl font-bold text-slate-800 my-3">
              #{userPosition}
            </div>
            <p className="text-xs text-slate-500">Joined as {userName}</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-1">People before you</p>
              <p className="text-3xl font-bold text-slate-800">{peopleAhead}</p>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-1">Estimated wait</p>
              <p className="text-3xl font-bold text-slate-800">~{estimatedWait}</p>
              <p className="text-xs text-slate-500">minutes</p>
            </div>
          </div>
          
          {/* Leave Queue Button */}
          <Button
            onClick={onLeave}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            Leave Queue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 4: PROGRESS SECTION =====
function ProgressSection({ currentServing, totalInQueue, progress }) {
  return (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Currently serving:</span>
            <span className="font-bold text-slate-800 text-lg">#{currentServing}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-slate-600 to-slate-800 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-slate-500 text-center">
            {currentServing} of {totalInQueue} served today
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 5: INFO / RULES =====
function InfoRules({ avgServiceTime }) {
  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardContent className="pt-6">
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <span className="text-slate-400">•</span>
            <span>Queue resets daily at midnight</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-400">•</span>
            <span>Missing your turn may skip your position</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-400">•</span>
            <span>Average service time: {avgServiceTime} minutes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 6: CALL TO ACTION HINT =====
function CallToActionHint({ isNext, isAlmostNext }) {
  if (!isNext && !isAlmostNext) return null;
  
  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        {isNext 
          ? "🎉 You're next! Please come to the shop now."
          : "⏰ You can come in ~15 minutes. Please stay nearby."}
      </AlertDescription>
    </Alert>
  );
}

// ===== COMPONENT 7: DEBUG PANEL =====
function DebugPanel({ clientId, userPosition, currentServing, peopleAhead, estimatedWait, progress }) {
  return (
    <div className="bg-slate-800 text-white p-3 rounded text-xs font-mono space-y-1">
      <div>Client ID: {clientId.slice(0, 8)}...</div>
      <div>Position: {userPosition} | Serving: {currentServing} | Ahead: {peopleAhead}</div>
      <div>Wait: ~{estimatedWait}min | Progress: {progress.toFixed(1)}%</div>
    </div>
  );
}

// ===== MAIN APP COMPONENT =====
export default function BarberQueueClient() {
  // ===== SOURCE OF TRUTH STATE ONLY =====
  const [queueOpen, setQueueOpen] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [userName, setUserName] = useState('');
  const [clientId, setClientId] = useState('');
  
  // Core queue data (from Firebase)
  const [userPosition, setUserPosition] = useState(null);
  const [currentServing, setCurrentServing] = useState(0);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [avgServiceTime, setAvgServiceTime] = useState(15);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [loading, setLoading] = useState(true);

  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [lastNotifiedState, setLastNotifiedState] = useState<'none' | 'almost' | 'next'>('none');
  
  // ===== COMPUTED VALUES (NOT STATE) =====
  const estimatedWait = peopleAhead * avgServiceTime;
  const progress = totalInQueue > 0 ? (currentServing / totalInQueue) * 100 : 0;
  
  // Determine user status
  const isNext = peopleAhead === 0 && inQueue;
  const isAlmostNext = peopleAhead <= 1 && peopleAhead > 0 && inQueue;

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
  }, []);

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
        setCurrentServing(data.currentNumber ?? 0);
        setTotalInQueue(data.lastNumber ?? 0);
        setAvgServiceTime(data.avgServiceTime ?? 15);
  
        setLoading(false); // ✅ THIS UNBLOCKS THE UI
      },
      (error) => {
        console.error("❌ Queue listener error:", error);
        setLoading(false); // prevent infinite loading on error
      }
    );
  
    return () => unsubscribe();
  }, []);  

  useEffect(() => {
    if (!inQueue || !notificationsGranted || !canSendNotifications()) {
      return;
    }
  
    // Determine current state
    let currentState: 'none' | 'almost' | 'next' = 'none';
    
    if (peopleAhead === 0) {
      currentState = 'next';
    } else if (peopleAhead <= 2) {
      currentState = 'almost';
    }
  
    // Only notify on state changes
    if (currentState === lastNotifiedState) {
      return;
    }
  
    // Send appropriate notification
    if (currentState === 'next' && lastNotifiedState !== 'next') {
      QueueNotifications.notifyNext(userName, userPosition || 0);
      setLastNotifiedState('next');
    } else if (currentState === 'almost' && lastNotifiedState === 'none') {
      QueueNotifications.notifyAlmostNext(userName, userPosition || 0, peopleAhead);
      setLastNotifiedState('almost');
    }
  
    // Reset state when moving away from critical positions
    if (currentState === 'none' && lastNotifiedState !== 'none') {
      setLastNotifiedState('none');
    }
  }, [peopleAhead, inQueue, notificationsGranted, userName, userPosition, lastNotifiedState]);

  useEffect(() => {
    const q = query(
      collection(db, "queues", "today", "clients"),
      where("status", "==", "waiting"),
      where("number", "<", userPosition)
    );
    
    const unsubscribe = onSnapshotCollection(q, (snapshot) => {
      setPeopleAhead(snapshot.size);
    });
    
    return () => unsubscribe();
  }, [inQueue, userPosition]);
  
  // ===== CLIENT IDENTITY & PERSISTENCE =====
  // Load saved client data on mount
  useEffect(() => {
    const savedClient = localStorage.getItem("queueClient");
    if (!savedClient) return;
  
    try {
      const data = JSON.parse(savedClient);
      setClientId(data.id);
      setUserName(data.name);
      setUserPosition(data.number);
      setInQueue(true);
    } catch (err) {
      console.error("❌ Failed to parse saved client:", err);
      localStorage.removeItem("queueClient");
    }
  }, []);
  
  // ===== FIREBASE: RESTORE CLIENT & LISTEN TO STATUS =====
  useEffect(() => {
    if (!clientId) return;
  
    const clientRef = doc(db, "queues", "today", "clients", clientId);
  
    const unsubscribe = onSnapshot(clientRef, (snap) => {
      if (!snap.exists()) return;
  
      const data = snap.data();
  
      if (data.status === "done" || data.status === "skipped") {
        alert(
          data.status === "done"
            ? "✅ Your service is complete!"
            : "⚠️ Your turn has passed. Please speak to the barber."
        );
  
        localStorage.removeItem("queueClient");
        setInQueue(false);
        setClientId("");
        setUserPosition(null);
      }
    });
  
    return () => unsubscribe();
  }, [clientId]);
  
  // Save client data to localStorage whenever it changes
  useEffect(() => {
    if (inQueue && clientId && userName && userPosition) {
      const clientData = {
        id: clientId,
        name: userName,
        number: userPosition,
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem('queueClient', JSON.stringify(clientData));
    }
  }, [inQueue, clientId, userName, userPosition]);
  
  // ===== ACTIONS =====
  const handleJoinQueue = async () => {
    if (loading || inQueue || !userName.trim()) return;
  
    try {
      setLoading(true);
  
      const queueRef = doc(db, "queues", "today");
  
      // Run transaction to safely get next number
      const clientData = await runTransaction(db, async (transaction) => {
        const queueSnap = await transaction.get(queueRef);
  
        if (!queueSnap.exists()) {
          throw new Error("Queue not initialized");
        }
  
        const queueData = queueSnap.data();
  
        if (!queueData.queueOpen) {
          throw new Error("Queue is closed");
        }
  
        const nextNumber = (queueData.lastNumber ?? 0) + 1;
        const clientId = crypto.randomUUID();
  
        const clientRef = doc(db, "queues", "today", "clients", clientId);
  
        const newClient = {
          id: clientId,
          name: userName,
          number: nextNumber,
          status: "waiting",
          joinedAt: serverTimestamp(),
        };
  
        // 🔐 Atomic writes
        transaction.set(clientRef, newClient);
        transaction.update(queueRef, {
          lastNumber: nextNumber,
          updatedAt: serverTimestamp(),
        });
  
        return newClient;
      });
  
      // ✅ Save to state & localStorage
      setClientId(clientData.id);
      setUserPosition(clientData.number);
      setInQueue(true);
  
      localStorage.setItem(
        "queueClient",
        JSON.stringify({
          id: clientData.id,
          name: clientData.name,
          number: clientData.number,
          joinedAt: new Date().toISOString(),
        })
      );
  
    } catch (err) {
      console.error("❌ Join queue failed:", err);
      alert(err.message || "Failed to join queue");
    } finally {
      setLoading(false);
    }
  };
  
  const handleLeaveQueue = async () => {
    if (!confirm('Are you sure you want to leave the queue?')) return;

    try {
      // Update client status in Firestore
      if (clientId) {
        const clientRef = doc(db, 'queues', 'today', 'clients', clientId);
        await setDoc(
          clientRef,
          {
            status: 'left',
            leftAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Clear localStorage
      localStorage.removeItem('queueClient');
      
      // Reset state
      setInQueue(false);
      setClientId('');
      setUserPosition(null);
      setUserName('');
      
    } catch (error) {
      console.error('❌ Failed to leave queue:', error);
      // Still clear local state even if Firebase update fails
      localStorage.removeItem('queueClient');
      setInQueue(false);
      setClientId('');
      setUserPosition(null);
      setUserName('');
    }
  };
  
  // ===== RENDER =====
  // Show loading state while fetching queue data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="w-12 h-12 text-slate-400 animate-pulse mx-auto mb-4" />
          <p className="text-slate-600">Loading queue...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-8">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Scissors className="w-8 h-8 text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-800">Barber Elite</h1>
          </div>
          <p className="text-sm text-slate-600">Ramadan Queue System</p>
        </div>
      </div>
      
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Status Banner */}
        <StatusBanner 
          queueOpen={queueOpen}
          inQueue={inQueue}
          isNext={isNext}
          isAlmostNext={isAlmostNext}
        />
        
        {/* Debug Panel (Remove in production) */}
        {inQueue && (
          <DebugPanel
            clientId={clientId}
            userPosition={userPosition}
            currentServing={currentServing}
            peopleAhead={peopleAhead}
            estimatedWait={estimatedWait}
            progress={progress}
          />
        )}
        
        {/* Main Content - Conditional Rendering */}
        {!inQueue ? (
          <JoinQueueForm
            userName={userName}
            setUserName={setUserName}
            queueOpen={queueOpen}
            onJoin={handleJoinQueue}
          />
        ) : (
          <QueueStatus
            userName={userName}
            userPosition={userPosition}
            peopleAhead={peopleAhead}
            estimatedWait={estimatedWait}
            onLeave={handleLeaveQueue}
          />
        )}
        
        {/* Progress Section - Only when in queue */}
        {inQueue && (
          <ProgressSection
            currentServing={currentServing}
            totalInQueue={totalInQueue}
            progress={progress}
          />
        )}
        
        {/* Call-to-Action Hint */}
        {inQueue && (
          <CallToActionHint
            isNext={isNext}
            isAlmostNext={isAlmostNext}
          />
        )}
        
        {/* Info / Rules */}
        <InfoRules avgServiceTime={avgServiceTime} />
        <InstallPWA />
        
        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            Powered by Queue Master
          </p>
        </div>
      </div>
      {/* Add NotificationPrompt - only show when user joins queue */}
      {inQueue && (
        <NotificationPrompt
          userName={userName}
          onPermissionChange={(granted) => {
            setNotificationsGranted(granted);
            console.log('Notifications:', granted ? 'enabled' : 'disabled');
          }}
        />
      )}
    </div>
  );
}