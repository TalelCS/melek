"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scissors, Clock, Users, AlertCircle } from 'lucide-react';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, increment, serverTimestamp, runTransaction } from 'firebase/firestore';
import { collection, query, where, onSnapshot as onSnapshotCollection } from 'firebase/firestore';
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import InstallPWA from '@/components/installPWA';
import NotificationPrompt from '@/components/NotificationPrompt';
import { QueueNotifications, canSendNotifications } from '@/lib/notifications';
import { db } from '@/lib/firebase';

// ===== COMPONENT 1: STATUS BANNER =====
function StatusBanner({ queueOpen, inQueue, isNext, isAlmostNext }) {
  const getStatus = () => {
    if (!queueOpen) {
      return {
        icon: '🌙',
        text: 'Queue is closed',
        className: 'bg-gradient-to-r from-rose-50 to-orange-50 border-rose-300 text-rose-900'
      };
    }
    
    if (isNext) {
      return {
        icon: '✨',
        text: "You're being served - Please come to the shop!",
        className: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400 text-emerald-900'
      };
    }
    
    if (isAlmostNext) {
      return {
        icon: '⭐',
        text: 'Almost your turn - Please come to the shop',
        className: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-400 text-amber-900'
      };
    }
    
    return {
      icon: '🌟',
      text: 'Queue is open - Join now',
      className: 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 text-emerald-900'
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
  const handleSubmit = () => {
    if (userName.trim() && queueOpen) {
      onJoin();
    }
  };
  
  return (
    <Card className="shadow-xl border-2 border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 overflow-hidden relative">
      {/* Decorative Islamic Pattern Corner */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" className="text-amber-600"/>
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" className="text-amber-600"/>
          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1" className="text-amber-600"/>
          <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="1" className="text-amber-600"/>
        </svg>
      </div>
      
      <CardHeader className="pb-4 relative">
        <CardTitle className="text-center text-xl text-emerald-900">
          🌙 Join Today's Queue
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-emerald-800 mb-2">
              Your Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="text-lg h-12 border-emerald-200 focus:border-amber-400 focus:ring-amber-400"
              disabled={!queueOpen}
            />
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!userName.trim() || !queueOpen}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 hover:from-emerald-800 hover:to-emerald-700 shadow-lg"
          >
            Join Queue ✨
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 3: QUEUE STATUS =====
function QueueStatus({ userName, userPosition, peopleAhead, estimatedWait, onLeave }) {
  return (
    <Card className="shadow-xl border-2 border-amber-200/50 bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden relative">
      {/* Decorative stars */}
      <div className="absolute top-2 left-2 text-yellow-300 opacity-20 text-2xl">✨</div>
      <div className="absolute top-4 right-4 text-yellow-300 opacity-20 text-xl">⭐</div>
      <div className="absolute bottom-4 left-6 text-yellow-300 opacity-20 text-lg">🌟</div>
      
      <CardHeader className="pb-4 relative">
        <CardTitle className="text-center text-xl text-emerald-900">
          You're in the queue ✅
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="space-y-6">
          {/* Queue Position - Big Number */}
          <div className="text-center">
            <p className="text-sm text-emerald-700 mb-1">Your number</p>
            <div className="text-6xl font-bold bg-gradient-to-br from-yellow-400 to-yellow-500 bg-clip-text text-transparent my-3">
              #{userPosition}
            </div>
            <p className="text-xs text-emerald-600">Joined as {userName}</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 text-white/80 rounded-lg p-4 text-center border border-emerald-100">
              <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm text-emerald-700 mb-1">People before you</p>
              <p className="text-3xl font-bold text-emerald-900">{peopleAhead}</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 text-center border border-amber-100">
              <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-amber-700 mb-1">Estimated wait</p>
              <p className="text-3xl font-bold text-amber-900">~{estimatedWait}</p>
              <p className="text-xs text-amber-600">minutes</p>
            </div>
          </div>
          
          {/* Leave Queue Button */}
          <Button
            onClick={onLeave}
            variant="outline"
            className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
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
    <Card className="shadow-md border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-700">Currently serving:</span>
            <span className="font-bold text-emerald-900 text-lg">#{currentServing}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-emerald-600 text-center">
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
    <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white/80 border-emerald-200">
      <CardContent className="pt-6">
        <div className="space-y-2 text-xs text-emerald-800">
          <div className="flex items-start gap-2">
            <span className="text-amber-500">🌙</span>
            <span>Queue resets daily at midnight</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500">⭐</span>
            <span>Missing your turn may skip your position</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500">✨</span>
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
    <div className="bg-emerald-900 text-white p-3 rounded text-xs font-mono space-y-1 border border-amber-400/30">
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
  
        setLoading(false);
      },
      (error) => {
        console.error("❌ Queue listener error:", error);
        setLoading(false);
      }
    );
  
    return () => unsubscribe();
  }, []);  

  useEffect(() => {
    if (!inQueue || !notificationsGranted || !canSendNotifications()) {
      return;
    }
  
    let currentState: 'none' | 'almost' | 'next' = 'none';
    
    if (peopleAhead === 0) {
      currentState = 'next';
    } else if (peopleAhead <= 2) {
      currentState = 'almost';
    }
  
    if (currentState === lastNotifiedState) {
      return;
    }
  
    if (currentState === 'next' && lastNotifiedState !== 'next') {
      QueueNotifications.notifyNext(userName, userPosition || 0);
      setLastNotifiedState('next');
    } else if (currentState === 'almost' && lastNotifiedState === 'none') {
      QueueNotifications.notifyAlmostNext(userName, userPosition || 0, peopleAhead);
      setLastNotifiedState('almost');
    }
  
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
  
        transaction.set(clientRef, newClient);
        transaction.update(queueRef, {
          lastNumber: nextNumber,
          updatedAt: serverTimestamp(),
        });
  
        return newClient;
      });
  
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

      localStorage.removeItem('queueClient');
      
      setInQueue(false);
      setClientId('');
      setUserPosition(null);
      setUserName('');
      
    } catch (error) {
      console.error('❌ Failed to leave queue:', error);
      localStorage.removeItem('queueClient');
      setInQueue(false);
      setClientId('');
      setUserPosition(null);
      setUserName('');
    }
  };
  
  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🌙</div>
          <Scissors className="w-12 h-12 text-yellow-300 animate-pulse mx-auto mb-4" />
          <p className="text-emerald-100">Loading queue...</p>
        </div>
      </div>
    );
  }
  
  return (
<div className="relative min-h-screen bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#1E1B4B] pb-8 overflow-hidden">
      {/* Header with Logo */}
            {/* 🌌 Stars Background Layer */}
      <StarsBackground />
      <ShootingStars />

      {/* Main Content Wrapper */}
  <div className="relative z-10">
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] backdrop-blur-md shadow-xl border-b">
        <div className="max-w-md mx-auto px-4 py-6 text-center">
          {/* 🎯 LOGO PLACEMENT - Replace the placeholder with your actual logo */}
          <div className="flex items-center justify-center gap-4 mb-3">
            {/* Option 1: Square Logo (Recommended) */}
            <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center border-2 border-amber-400">
              {/* Replace this div with: <img src="/path-to-your-logo.png" alt="Barber Elite" className="w-full h-full object-contain p-1" /> */}
              <img src="/log.png" alt="Barber Elite" className="w-full h-full object-contain rounded-md" />
              <Scissors className="w-8 h-8 text-emerald-700" />
            </div>
            
            <div className="text-left">
            <h1 className="text-2xl font-bold text-white tracking-wide">Barber Elite</h1>
            <p className="text-sm text-yellow-300/80">Ramadan Queue System</p>
            </div>
          </div>
          
          {/* Decorative Ramadan Elements */}
          <div className="flex items-center justify-center gap-3 text-yellow-300">
            <span className="text-sm">🌙</span>
            <div className="h-px bg-amber-400/30 flex-1"></div>
            <span className="text-xs text-amber-200">رمضان كريم</span>
            <div className="h-px bg-amber-400/30 flex-1"></div>
            <span className="text-sm">✨</span>
          </div>
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
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px bg-amber-400/20 flex-1"></div>
            <span className="text-amber-300 text-xl">🌙</span>
            <div className="h-px bg-amber-400/20 flex-1"></div>
          </div>
          <p className="text-xs text-emerald-200">
            Powered by Queue Master
          </p>
          <p className="text-xs text-amber-300 mt-1">
            رمضان مبارك
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
    </div>
  );
}