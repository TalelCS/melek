"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Scissors, Clock, Users, AlertCircle, PhoneCall } from 'lucide-react';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction, getDocs } from 'firebase/firestore';
import { collection, query, where, onSnapshot as onSnapshotCollection } from 'firebase/firestore';
import InstallPWA from '@/components/installPWA';
import NotificationPrompt from '@/components/NotificationPrompt';
import { QueueNotifications, canSendNotifications } from '@/lib/notifications';
import { StarRating } from "@/components/ui/star-rating";
import { db } from '@/lib/firebase';

// ── CHANGE 1: StatusBanner now uses a self-contained banner-shake animation
// instead of the global shake-glow class. Reasons:
//   - shake-glow applies a green box-shadow (success colour) on an error state
//   - box-shadow on the Alert wrapper bleeds outside its border, looking messy
//   - The new animation is scoped, snappy, and semantically correct
function StatusBanner({ queueOpen, inQueue, isNext, isAlmostNext }) {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!isNext) return;

    const interval = setInterval(() => {
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }, 4000);

    return () => clearInterval(interval);
  }, [isNext]);

  const getStatus = () => {
    if (!queueOpen) {
      return {
        icon: '🌙',
        text: 'La file d\'attente est fermée',
        className: 'bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-200'
      };
    }

    if (isNext) {
      return {
        icon: '✨',
        text: "C'est votre tour - Veuillez venir au salon !",
        className: 'bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-200'
      };
    }

    if (isAlmostNext) {
      return {
        icon: '⭐',
        text: 'Presque votre tour - Veuillez venir au salon',
        className: 'bg-amber-500/10 backdrop-blur-md border border-amber-500/20 text-amber-200'
      };
    }

    return {
      icon: '🌟',
      text: 'La file d\'attente est ouverte',
      className: 'bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-200'
    };
  };

  const status = getStatus();

  return (
    <>
      <Alert className={`${status.className} ${shake ? 'banner-shake' : ''}`}>
        <AlertDescription className="text-center font-semibold text-base">
          {status.icon} {status.text}
        </AlertDescription>
      </Alert>
      <style>{`
        @keyframes banner-shake {
          0%   { transform: translateX(0);    }
          12%  { transform: translateX(-5px); }
          25%  { transform: translateX(5px);  }
          38%  { transform: translateX(-4px); }
          52%  { transform: translateX(3px);  }
          65%  { transform: translateX(-2px); }
          78%  { transform: translateX(2px);  }
          100% { transform: translateX(0);    }
        }
        .banner-shake {
          animation: banner-shake 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </>
  );
}

// ===== COMPONENT 2: JOIN QUEUE FORM =====
function JoinQueueForm({ firstName, setFirstName, lastName, setLastName, phoneNumber, setPhoneNumber, queueOpen, onJoin, joining }) {
  const handleSubmit = () => {
    const isValidPhone = /^\d{8}$/.test(phoneNumber);
    if (firstName.trim() && lastName.trim() && isValidPhone && queueOpen) {
      onJoin();
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,8}$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  const isValidPhone = /^\d{8}$/.test(phoneNumber);
  
  return (
    <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
          Rejoindre la file d'attente
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Prénom
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-amber-500/50 focus:ring-amber-500/50"
                disabled={!queueOpen || joining}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Nom
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-amber-500/50 focus:ring-amber-500/50"
                disabled={!queueOpen || joining}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
              Numéro de téléphone
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
              disabled={!queueOpen || joining}
              maxLength={8}
            />
            {phoneNumber && !isValidPhone && (
              <p className="text-xs text-red-400 mt-1" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Le numéro doit contenir exactement 8 chiffres
              </p>
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!firstName.trim() || !lastName.trim() || !isValidPhone || !queueOpen || joining}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 shadow-lg disabled:opacity-50"
            style={{ fontFamily: '"Raleway", sans-serif' }}
          >
            {joining ? 'Rejoindre...' : 'Rejoindre la file ✨'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 3: QUEUE STATUS =====
function QueueStatus({ firstName, lastName, phoneNumber, userNumber, peopleAhead, estimatedWait, onLeave, leaving }) {
  return (
    <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
          Vous êtes dans la file ✅
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-white/60 mb-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
              Votre numéro de ticket {firstName} est
            </p>
            <div className="text-7xl font-bold bg-gradient-to-br from-amber-400 to-yellow-500 bg-clip-text text-transparent my-4" style={{ fontFamily: '"Orbitron", monospace' }}>
              #{userNumber}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-white/60 mb-1" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Personnes avant vous
              </p>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: '"Orbitron", monospace' }}>
                {peopleAhead}
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-white/60 mb-1" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Attente estimée
              </p>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: '"Orbitron", monospace' }}>
                ~{estimatedWait}
              </p>
              <p className="text-xs text-white/60" style={{ fontFamily: '"Raleway", sans-serif' }}>
                minutes
              </p>
            </div>
          </div>
          
          <Button
            onClick={onLeave}
            disabled={leaving}
            variant="outline"
            className="w-full bg-white/5 border-white/20 text-white/80 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-200 disabled:opacity-50"
            style={{ fontFamily: '"Raleway", sans-serif' }}
          >
            {leaving ? 'Quitter...' : 'Quitter la file'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== COMPONENT 4: PROGRESS SECTION =====
function ProgressSection({ initialPeopleAhead, peopleAhead }) {
  const served = Math.max(0, initialPeopleAhead - peopleAhead);
  const progress = initialPeopleAhead > 0 ? (served / initialPeopleAhead) * 100 : 0;
  
  return (
    <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60" style={{ fontFamily: '"Raleway", sans-serif' }}>
              Votre progression :
            </span>
            <span className="font-bold text-white" style={{ fontFamily: '"Raleway", sans-serif' }}>
              {served} / {initialPeopleAhead} servi(s)
            </span>
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-white/60 text-center" style={{ fontFamily: '"Raleway", sans-serif' }}>
            {peopleAhead === 0 
              ? "C'est votre tour ! 🎉" 
              : `${peopleAhead} personne${peopleAhead === 1 ? '' : 's'} avant votre tour`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== MAIN APP COMPONENT =====
export default function BarberQueueClient() {
  const [queueOpen, setQueueOpen] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clientId, setClientId] = useState('');
  
  const [userNumber, setUserNumber] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [avgServiceTime, setAvgServiceTime] = useState(15);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [initialPeopleAhead, setInitialPeopleAhead] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [lastNotifiedState, setLastNotifiedState] = useState<'none' | 'almost' | 'next'>('none');
  
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    title: '',
    description: '',
    action: null as (() => void) | null,
    showCancel: false,
  });

  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
  const estimatedWait = peopleAhead * avgServiceTime;
  const isNext = peopleAhead === 0 && inQueue;
  const isAlmostNext = peopleAhead <= 1 && peopleAhead > 0 && inQueue;

  useEffect(() => {
    document.body.style.overflow = "auto";
  }, []);

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
        } catch (error) {
          console.error("❌ Failed to initialize queue:", error);
        }
      }
    };
    
    initQueue();
  }, []);

  useEffect(() => {
    const queueRef = doc(db, "queues", "today");
  
    const unsubscribe = onSnapshot(
      queueRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
  
        setQueueOpen(data.queueOpen ?? true);
        setCurrentPosition(data.currentPosition ?? 0);
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
    if (!inQueue || !notificationsGranted || !canSendNotifications()) return;
  
    let currentState: 'none' | 'almost' | 'next' = 'none';
    
    if (peopleAhead === 0) {
      currentState = 'next';
    } else if (peopleAhead <= 2) {
      currentState = 'almost';
    }
  
    if (currentState === lastNotifiedState) return;
  
    if (currentState === 'next' && lastNotifiedState !== 'next') {
      QueueNotifications.notifyNext(`${firstName} ${lastName}`, userNumber || 0);
      setLastNotifiedState('next');
    } else if (currentState === 'almost' && lastNotifiedState === 'none') {
      QueueNotifications.notifyAlmostNext(`${firstName} ${lastName}`, userNumber || 0, peopleAhead);
      setLastNotifiedState('almost');
    }
  
    if (currentState === 'none' && lastNotifiedState !== 'none') {
      setLastNotifiedState('none');
    }
  }, [peopleAhead, inQueue, notificationsGranted, firstName, lastName, userNumber, lastNotifiedState]);

  useEffect(() => {
    if (!inQueue || !userPosition) return;
    
    const q = query(
      collection(db, "queues", "today", "clients"),
      where("status", "==", "waiting"),
      where("position", "<", userPosition)
    );
    
    const unsubscribe = onSnapshotCollection(q, (snapshot) => {
      setPeopleAhead(snapshot.size);
    });
    
    return () => unsubscribe();
  }, [inQueue, userPosition]);
  
  useEffect(() => {
    const savedClient = localStorage.getItem("queueClient");
    if (!savedClient) return;
  
    try {
      const data = JSON.parse(savedClient);
      setClientId(data.id);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhoneNumber(data.phoneNumber);
      setUserNumber(data.number);
      setUserPosition(data.position);
      setInitialPeopleAhead(data.initialPeopleAhead || 0);
      setInQueue(true);
    } catch (err) {
      console.error("❌ Failed to parse saved client:", err);
      localStorage.removeItem("queueClient");
    }
  }, []);
  
  useEffect(() => {
    if (!clientId) return;
  
    const clientRef = doc(db, "queues", "today", "clients", clientId);
  
    const unsubscribe = onSnapshot(clientRef, (snap) => {
      if (!snap.exists()) {
        localStorage.removeItem("queueClient");
        setInQueue(false);
        setClientId("");
        setUserNumber(null);
        setUserPosition(null);
        setFirstName("");
        setLastName("");
        setPhoneNumber("");
        setAlertDialog({
          open: true,
          title: 'Retiré de la file',
          description: '⚠️ Vous avez été retiré de la file d\'attente. Veuillez vous réinscrire si nécessaire.',
          action: () => setAlertDialog(prev => ({ ...prev, open: false })),
          showCancel: false,
        });
        return;
      }
  
      const data = snap.data();
      
      if (data.position !== userPosition) {
        setUserPosition(data.position);
      }
  
      if (data.status === "done") {
        localStorage.removeItem("queueClient");
        setInQueue(false);
        setClientId("");
        setUserNumber(null);
        setUserPosition(null);
        setShowFeedback(true);

      } else if (data.status === "no_show") {
        // ── CHANGE 3: use QueueNotifications helper instead of raw new Notification()
        if (canSendNotifications()) {
          QueueNotifications.notifyNoShow();
        }
        
        localStorage.removeItem("queueClient");
        setInQueue(false);
        setClientId("");
        setUserNumber(null);
        setUserPosition(null);
        setFirstName("");
        setLastName("");
        setPhoneNumber("");
        setAlertDialog({
          open: true,
          title: 'Absence signalée',
          description: '⚠️ Vous avez été marqué comme absent après 3 reports. Veuillez parler au coiffeur si c\'était une erreur.',
          action: () => setAlertDialog(prev => ({ ...prev, open: false })),
          showCancel: false,
        });

      } else if (data.status === "removed_by_admin") {
        const reason = data.removalReason || "Aucune raison spécifiée";

        // ── CHANGE 4: use QueueNotifications helper instead of raw new Notification()
        if (canSendNotifications()) {
          QueueNotifications.notifyRemovedByAdmin(reason);
        }
        
        localStorage.removeItem("queueClient");
        setInQueue(false);
        setClientId("");
        setUserNumber(null);
        setUserPosition(null);
        setFirstName("");
        setLastName("");
        setPhoneNumber("");
        
        setAlertDialog({
          open: true,
          title: 'Retiré par l\'administrateur',
          description: (
            <div className="space-y-3">
              <p>⚠️ Vous avez été retiré de la file d'attente par l'administrateur.</p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm font-semibold text-amber-400 mb-1">Raison:</p>
                <p className="text-sm text-white">{reason}</p>
              </div>
              <p className="text-sm">Si vous pensez que c'est une erreur, veuillez contacter le salon:</p>
              <a 
                href="tel:+21652265816" 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                onClick={(e) => { e.stopPropagation(); }}
              >
                <PhoneCall className="w-4 h-4" />
                Appeler le salon
              </a>
            </div>
          ),
          action: () => setAlertDialog(prev => ({ ...prev, open: false })),
          showCancel: false,
        });

      } else if (data.status === "left") {
        localStorage.removeItem("queueClient");
        setInQueue(false);
        setClientId("");
        setUserNumber(null);
        setUserPosition(null);
        setFirstName("");
        setLastName("");
        setPhoneNumber("");
      }
    });
  
    return () => unsubscribe();
  }, [clientId, userPosition]);
  
  useEffect(() => {
    if (inQueue && clientId && firstName && lastName && phoneNumber && userNumber && userPosition) {
      const clientData = {
        id: clientId,
        firstName,
        lastName,
        phoneNumber,
        number: userNumber,
        position: userPosition,
        initialPeopleAhead,
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem('queueClient', JSON.stringify(clientData));
    }
  }, [inQueue, clientId, firstName, lastName, phoneNumber, userNumber, userPosition, initialPeopleAhead]);
  
  const handleJoinQueue = async () => {
    if (joining || inQueue || !firstName.trim() || !lastName.trim() || !phoneNumber.trim()) return;
  
    try {
      setJoining(true);
      
      const duplicateQuery = query(
        collection(db, "queues", "today", "clients"),
        where("phoneNumber", "==", phoneNumber),
        where("status", "==", "waiting")
      );
      
      const duplicates = await getDocs(duplicateQuery);
      
      if (!duplicates.empty) {
        setAlertDialog({
          open: true,
          title: 'Numéro déjà utilisé',
          description: '⚠️ Ce numéro de téléphone est déjà dans la file d\'attente !',
          action: () => setAlertDialog(prev => ({ ...prev, open: false })),
          showCancel: false,
        });
        setJoining(false);
        return;
      }
  
      const queueRef = doc(db, "queues", "today");
  
      const clientData = await runTransaction(db, async (transaction) => {
        const queueSnap = await transaction.get(queueRef);
  
        if (!queueSnap.exists()) throw new Error("File d'attente non initialisée");
  
        const queueData = queueSnap.data();
  
        if (!queueData.queueOpen) throw new Error("La file d'attente est fermée");
  
        const nextNumber = (queueData.lastNumber ?? 0) + 1;
        const nextPosition = nextNumber;
        const clientId = crypto.randomUUID();
  
        const clientRef = doc(db, "queues", "today", "clients", clientId);
        
        const currentPos = queueData.currentPosition ?? 0;
        const peopleAheadNow = Math.max(0, nextPosition - currentPos - 1);
  
        const newClient = {
          id: clientId,
          firstName,
          lastName,
          phoneNumber,
          number: nextNumber,
          position: nextPosition,
          status: "waiting",
          skipCount: 0,
          joinedAt: serverTimestamp(),
        };
  
        transaction.set(clientRef, newClient);
        transaction.update(queueRef, {
          lastNumber: nextNumber,
          updatedAt: serverTimestamp(),
        });
  
        return { ...newClient, initialPeopleAhead: peopleAheadNow };
      });
  
      setClientId(clientData.id);
      setUserNumber(clientData.number);
      setUserPosition(clientData.position);
      setInitialPeopleAhead(clientData.initialPeopleAhead);
      setInQueue(true);
  
      localStorage.setItem(
        "queueClient",
        JSON.stringify({
          id: clientData.id,
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          phoneNumber: clientData.phoneNumber,
          number: clientData.number,
          position: clientData.position,
          initialPeopleAhead: clientData.initialPeopleAhead,
          joinedAt: new Date().toISOString(),
        })
      );
  
    } catch (err) {
      console.error("❌ Join queue failed:", err);
      setAlertDialog({
        open: true,
        title: 'Erreur',
        description: err.message || "Échec de l'inscription à la file d'attente",
        action: () => setAlertDialog(prev => ({ ...prev, open: false })),
        showCancel: false,
      });
    } finally {
      setJoining(false);
    }
  };
  
  const handleLeaveQueue = async () => {
    setAlertDialog({
      open: true,
      title: 'Quitter la file',
      description: 'Êtes-vous sûr de vouloir quitter la file d\'attente ?',
      showCancel: true,
      action: async () => {
        try {
          setLeaving(true);
          setAlertDialog(prev => ({ ...prev, open: false }));
          
          if (clientId && userPosition) {
            const clientRef = doc(db, 'queues', 'today', 'clients', clientId);
            const queueRef = doc(db, 'queues', 'today');
            
            if (userPosition === currentPosition) {
              await runTransaction(db, async (transaction) => {
                transaction.update(clientRef, {
                  status: 'left',
                  leftAt: serverTimestamp(),
                });
                transaction.update(queueRef, {
                  currentPosition: currentPosition + 1,
                  updatedAt: serverTimestamp(),
                });
              });
            } else {
              await updateDoc(clientRef, {
                status: 'left',
                leftAt: serverTimestamp(),
              });
            }
          }

          localStorage.removeItem('queueClient');
          setInQueue(false);
          setClientId('');
          setUserNumber(null);
          setUserPosition(null);
          setFirstName('');
          setLastName('');
          setPhoneNumber('');
          
        } catch (error) {
          console.error('❌ Failed to leave queue:', error);
          localStorage.removeItem('queueClient');
          setInQueue(false);
          setClientId('');
          setUserNumber(null);
          setUserPosition(null);
          setFirstName('');
          setLastName('');
          setPhoneNumber('');
        } finally {
          setLeaving(false);
        }
      }
    });
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      setAlertDialog({
        open: true,
        title: 'Évaluation requise',
        description: 'Veuillez sélectionner une note avant de soumettre.',
        action: () => setAlertDialog(prev => ({ ...prev, open: false })),
        showCancel: false,
      });
      return;
    }

    try {
      setSubmittingFeedback(true);
      
      const feedbackRef = collection(db, 'feedback');
      await setDoc(doc(feedbackRef), {
        firstName,
        lastName,
        phoneNumber,
        rating,
        review: review.trim() || null,
        submittedAt: serverTimestamp(),
      });
      
      setShowFeedback(false);
      setAlertDialog({
        open: true,
        title: 'Merci !',
        description: '✅ Votre avis a été enregistré. Merci pour votre retour !',
        action: () => {
          setAlertDialog(prev => ({ ...prev, open: false }));
          setRating(0);
          setReview('');
        },
        showCancel: false,
      });
    } catch (error) {
      console.error('❌ Échec de soumission:', error);
      setAlertDialog({
        open: true,
        title: 'Erreur',
        description: 'Échec de l\'envoi de votre avis. Veuillez réessayer.',
        action: () => setAlertDialog(prev => ({ ...prev, open: false })),
        showCancel: false,
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSkipFeedback = () => {
    setShowFeedback(false);
    setRating(0);
    setReview('');
    setAlertDialog({
      open: true,
      title: 'Service terminé',
      description: '✅ Votre service est terminé ! Merci.',
      action: () => setAlertDialog(prev => ({ ...prev, open: false })),
      showCancel: false,
    });
  };
  
  if (loading) {
    return (
      <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Raleway:wght@300;400;600;700&family=Lora:wght@400;500&family=Orbitron:wght@700;900&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <div className="relative min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Scissors className="w-16 h-16 text-amber-400 animate-pulse mx-auto mb-4" />
            <p className="text-white/80 text-lg" style={{ fontFamily: '"Raleway", sans-serif' }}>
              Chargement de la file...
            </p>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Raleway:wght@300;400;600;700&family=Lora:wght@400;500&family=Orbitron:wght@700;900&family=Amiri:wght@400;700&display=swap"
        rel="stylesheet"
      />
      
      <div className="relative z-10">
        <div className="max-w-md mx-auto px-4 text-center" style={{
          paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))'
        }}>
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg flex items-center justify-center">
              <img src="/log.png" alt="Melek Coiff" className="w-full h-full object-contain rounded-md" />
            </div>
            
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
                Melek Coiff
              </h1>
              <p className="text-sm text-amber-400" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Système de file Ramadan
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-3 text-amber-400">
            <span>🌙</span>
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-sm text-white/60" style={{ fontFamily: '"Amiri", serif' }}>
              رمضان كريم
            </span>
            <div className="h-px bg-white/20 flex-1"></div>
            <span>✨</span>
          </div>
        </div>
        
        <div className="max-w-md mx-auto px-4 py-6 space-y-6" style={{
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))'
        }}>
          <StatusBanner 
            queueOpen={queueOpen}
            inQueue={inQueue}
            isNext={isNext}
            isAlmostNext={isAlmostNext}
          />
          
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
              joining={joining}
            />
          ) : (
            <QueueStatus
              firstName={firstName}
              lastName={lastName}
              phoneNumber={phoneNumber}
              userNumber={userNumber}
              peopleAhead={peopleAhead}
              estimatedWait={estimatedWait}
              onLeave={handleLeaveQueue}
              leaving={leaving}
            />
          )}
          
          {inQueue && (
            <ProgressSection
              initialPeopleAhead={initialPeopleAhead}
              peopleAhead={peopleAhead}
            />
          )}
          
          <InstallPWA />

          {/* Social Media Footer */}
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <p className="text-lg text-white mb-5" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Suivez-nous
              </p>

              <div className="flex justify-center gap-6">
                <a href="https://www.instagram.com/mvleek__coiff_93/" target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="https://www.facebook.com/malek.boulares.50" target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="tel:+21652265816" className="icon-btn" aria-label="Phone">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </a>
                <a href="https://maps.app.goo.gl/XQp8N7fo7aTGjnRi7" target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Location">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-white pb-8">
              <span className="text-2xl">🌙</span>
              <div className="h-px bg-white/40 w-16 md:w-24" />
              <span className="text-lg md:text-xl" style={{ fontFamily: '"Amiri", serif' }}>
                رمضان كريم
              </span>
              <div className="h-px bg-white/40 w-16 md:w-24" />
              <span className="text-2xl">✨</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHANGE 2: NotificationPrompt moved outside the scrollable div.
          It renders position:fixed internally — placing it inside an
          overflow container caused it to be clipped and mispositioned. */}
      {inQueue && (
        <NotificationPrompt
          userName={`${firstName} ${lastName}`}
          onPermissionChange={(granted) => setNotificationsGranted(granted)}
        />
      )}

      {/* AlertDialog */}
      <AlertDialog open={alertDialog.open} onOpenChange={(open) => {
        if (!open && !alertDialog.showCancel) {
          setAlertDialog(prev => ({ ...prev, open: false }));
        }
      }}>
        <AlertDialogContent className="bg-gradient-to-br from-zinc-950/98 via-neutral-900/98 to-zinc-950/98 backdrop-blur-xl border-2 border-amber-500/20 shadow-2xl shadow-amber-500/10 rounded-2xl max-w-md">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 bg-clip-text text-transparent" style={{ fontFamily: '"Playfair Display", serif' }}>
              {alertDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300 text-base leading-relaxed" style={{ fontFamily: '"Raleway", sans-serif' }}>
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3 mt-6">
            {alertDialog.showCancel && (
              <AlertDialogCancel 
                onClick={() => setAlertDialog(prev => ({ ...prev, open: false }))}
                className="bg-white/5 border-2 border-zinc-700 text-zinc-300 hover:bg-white/10 hover:border-zinc-600 transition-all duration-200 rounded-xl h-11 px-6 font-semibold"
                style={{ fontFamily: '"Raleway", sans-serif' }}
              >
                Annuler
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={() => { if (alertDialog.action) alertDialog.action(); }}
              className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black hover:from-amber-500 hover:via-yellow-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/50 transition-all duration-200 rounded-xl h-11 px-6 font-bold"
              style={{ fontFamily: '"Raleway", sans-serif' }}
            >
              {alertDialog.showCancel ? 'Confirmer' : 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feedback Dialog */}
      <AlertDialog open={showFeedback} onOpenChange={setShowFeedback}>
        <AlertDialogContent className="bg-gradient-to-br from-zinc-950/98 via-neutral-900/98 to-zinc-950/98 backdrop-blur-xl border-2 border-amber-500/20 shadow-2xl shadow-amber-500/10 rounded-2xl max-w-md">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 bg-clip-text text-transparent" style={{ fontFamily: '"Playfair Display", serif' }}>
              Service Terminé ✅
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300 text-base leading-relaxed text-center" style={{ fontFamily: '"Raleway", sans-serif' }}>
              Merci d'avoir utilisé notre service ! Comment évalueriez-vous votre expérience ?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex justify-center gap-2 space-y-2 text-center">
              <StarRating 
                defaultValue={3}
                onRate={(newRating) => setRating(newRating)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Avis (optionnel)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Partagez votre expérience..."
                rows={4}
                className="w-full bg-white/5 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                style={{ fontFamily: '"Raleway", sans-serif' }}
              />
            </div>
          </div>

          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel 
              onClick={handleSkipFeedback}
              className="bg-white/5 border-2 border-zinc-700 text-zinc-300 hover:bg-white/10 hover:border-zinc-600 transition-all duration-200 rounded-xl h-11 px-6 font-semibold"
              style={{ fontFamily: '"Raleway", sans-serif' }}
            >
              Passer
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitFeedback}
              disabled={submittingFeedback}
              className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black hover:from-amber-500 hover:via-yellow-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/50 transition-all duration-200 rounded-xl h-11 px-6 font-bold disabled:opacity-50"
              style={{ fontFamily: '"Raleway", sans-serif' }}
            >
              {submittingFeedback ? 'Envoi...' : 'Envoyer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx>{`
        .icon-btn {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          color: white;
        }
        .icon-btn:hover {
          background: rgba(251, 191, 36, 0.2);
          border-color: #fbbf24;
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
}