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
        className: 'bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-200'
      };
    }
    
    if (isNext) {
      return {
        icon: '✨',
        text: "You're being served - Please come to the shop!",
        className: 'bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-200'
      };
    }
    
    if (isAlmostNext) {
      return {
        icon: '⭐',
        text: 'Almost your turn - Please come to the shop',
        className: 'bg-amber-500/10 backdrop-blur-md border border-amber-500/20 text-amber-200'
      };
    }
    
    return {
      icon: '🌟',
      text: 'Queue is open - Join now',
      className: 'bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-200'
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
function JoinQueueForm({ firstName, setFirstName, lastName, setLastName, phoneNumber, setPhoneNumber, queueOpen, onJoin }) {
  const handleSubmit = () => {
    // Validate Tunisian phone number (8 digits)
    const isValidPhone = /^\d{8}$/.test(phoneNumber);
    if (firstName.trim() && lastName.trim() && isValidPhone && queueOpen) {
      onJoin();
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 8 digits
    if (/^\d{0,8}$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  const isValidPhone = /^\d{8}$/.test(phoneNumber);
  
  return (
    <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl text-white">
          Join Today's Queue
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* First and Last Name - Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-2">
                First Name
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-amber-500/50 focus:ring-amber-500/50"
                disabled={!queueOpen}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-2">
                Last Name
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-amber-500/50 focus:ring-amber-500/50"
                disabled={!queueOpen}
              />
            </div>
          </div>

          {/* Phone Number - Full Width Below */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-white/80 mb-2">
              Phone Number
            </label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="12345678"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className={`bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-amber-500/50 focus:ring-amber-500/50 ${
                phoneNumber && !isValidPhone ? 'border-red-500/50' : ''
              }`}
              disabled={!queueOpen}
              maxLength={8}
            />
            {phoneNumber && !isValidPhone && (
              <p className="text-xs text-red-400 mt-1">
                Phone number must be exactly 8 digits
              </p>
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!firstName.trim() || !lastName.trim() || !isValidPhone || !queueOpen}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 shadow-lg disabled:opacity-50"
          >
            Join Queue ✨
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 3: QUEUE STATUS =====
function QueueStatus({ firstName, lastName, phoneNumber, userPosition, peopleAhead, estimatedWait, onLeave }) {
  return (
    <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl text-white">
          You're in the queue ✅
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Queue Position - Big Number */}
          <div className="text-center">
            <p className="text-sm text-white/60 mb-2">Your number</p>
            <div className="text-7xl font-bold bg-gradient-to-br from-amber-400 to-yellow-500 bg-clip-text text-transparent my-4">
              #{userPosition}
            </div>
            <p className="text-sm text-white/80">{firstName} {lastName}</p>
            <p className="text-xs text-white/60">{phoneNumber}</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-white/60 mb-1">People before you</p>
              <p className="text-3xl font-bold text-white">{peopleAhead}</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-white/60 mb-1">Estimated wait</p>
              <p className="text-3xl font-bold text-white">~{estimatedWait}</p>
              <p className="text-xs text-white/60">minutes</p>
            </div>
          </div>
          
          {/* Leave Queue Button */}
          <Button
            onClick={onLeave}
            variant="outline"
            className="w-full bg-white/5 border-white/20 text-white/80 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-200"
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
    <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Currently serving:</span>
            <span className="font-bold text-white text-xl">#{currentServing}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-white/60 text-center">
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
    <Card className="bg-white/5 backdrop-blur-md border border-white/10">
      <CardContent>
        <div className="space-y-2 text-sm text-white/70">
          <div className="flex items-start gap-3">
            <span className="text-amber-400">🌙</span>
            <span>Queue resets daily at midnight</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-amber-400">⭐</span>
            <span>Missing your turn may skip your position</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-amber-400">✨</span>
            <span>Average service time: {avgServiceTime} minutes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== MAIN APP COMPONENT =====
export default function BarberQueueClient() {
  // ===== SOURCE OF TRUTH STATE ONLY =====
  const [queueOpen, setQueueOpen] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
      QueueNotifications.notifyNext(`${firstName} ${lastName}`, userPosition || 0);
      setLastNotifiedState('next');
    } else if (currentState === 'almost' && lastNotifiedState === 'none') {
      QueueNotifications.notifyAlmostNext(`${firstName} ${lastName}`, userPosition || 0, peopleAhead);
      setLastNotifiedState('almost');
    }
  
    if (currentState === 'none' && lastNotifiedState !== 'none') {
      setLastNotifiedState('none');
    }
  }, [peopleAhead, inQueue, notificationsGranted, firstName, lastName, userPosition, lastNotifiedState]);

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
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhoneNumber(data.phoneNumber);
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
    if (inQueue && clientId && firstName && lastName && phoneNumber && userPosition) {
      const clientData = {
        id: clientId,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        number: userPosition,
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem('queueClient', JSON.stringify(clientData));
    }
  }, [inQueue, clientId, firstName, lastName, phoneNumber, userPosition]);
  
  // ===== ACTIONS =====
  const handleJoinQueue = async () => {
    if (loading || inQueue || !firstName.trim() || !lastName.trim() || !phoneNumber.trim()) return;
  
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
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phoneNumber,
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
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          phoneNumber: clientData.phoneNumber,
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
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      
    } catch (error) {
      console.error('❌ Failed to leave queue:', error);
      localStorage.removeItem('queueClient');
      setInQueue(false);
      setClientId('');
      setUserPosition(null);
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
    }
  };
  
  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center relative overflow-hidden">
        <StarsBackground />
        <ShootingStars />
        <div className="text-center relative z-10">
          <Scissors className="w-16 h-16 text-amber-400 animate-pulse mx-auto mb-4" />
          <p className="text-white/80 text-lg">Loading queue...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pb-8 overflow-hidden">
      {/* Stars Background */}
      <StarsBackground />
      <ShootingStars />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header - No separation, same background */}
        <div className="max-w-md mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg flex items-center justify-center">
              <img src="/log.png" alt="Barber Elite" className="w-full h-full object-contain rounded-md" />
            </div>
            
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">Barber Elite</h1>
              <p className="text-sm text-amber-400">Ramadan Queue System</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-3 text-amber-400">
            <span>🌙</span>
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-sm text-white/60">رمضان كريم</span>
            <div className="h-px bg-white/20 flex-1"></div>
            <span>✨</span>
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
          
          {/* Main Content - Conditional Rendering */}
          {!inQueue ? (
            <JoinQueueForm
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              queueOpen={queueOpen}
              onJoin={handleJoinQueue}
            />
          ) : (
            <QueueStatus
              firstName={firstName}
              lastName={lastName}
              phoneNumber={phoneNumber}
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
          
          {/* Info / Rules */}
          <InfoRules avgServiceTime={avgServiceTime} />
          <InstallPWA />
          
          {/* Footer */}
          <div className="text-center pt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px bg-white/20 flex-1"></div>
              <span className="text-amber-400">🌙</span>
              <div className="h-px bg-white/20 flex-1"></div>
            </div>
            <p className="text-sm text-white/60">
              Powered by
              <a className="text-amber-400 ml-1" href="https://www.instagram.com/talel_galai/" target="_blank" rel="noopener noreferrer">@talel_galai</a>
            </p>
            <p className="text-sm text-amber-400 mt-1">
              رمضان مبارك
            </p>
          </div>
        </div>
        
        {/* Notification Prompt */}
        {inQueue && (
          <NotificationPrompt
            userName={`${firstName} ${lastName}`}
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