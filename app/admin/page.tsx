"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Scissors, Users, Clock, AlertCircle, Check, SkipForward, Play, Pause, RefreshCw, PhoneCall, Lightbulb, Settings, UserPlus, List, BarChart } from 'lucide-react';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction, collection, query, where, orderBy, limit, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Dock from './Dock';

// ===== TYPES =====
type TabView = 'controls' | 'queue' | 'add' | 'stats';

// ===== COMPONENT: HEADER =====
function AdminHeader({ queueOpen, currentView }: { queueOpen: boolean; currentView: TabView }) {
  const viewTitles = {
    controls: 'Contrôles de la File',
    queue: 'Liste d\'Attente',
    add: 'Ajouter un Client',
    stats: 'Statistiques & Avis'
  };

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Raleway:wght@300;400;600;700&family=Lora:wght@400;500&family=Orbitron:wght@700;900&family=Amiri:wght@400;700&display=swap"
        rel="stylesheet"
      />
      
      <div>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg flex items-center justify-center">
                <img src="/log.png" alt="Melek Coiff" className="w-full h-full object-contain rounded-md" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
                  Melek Coiff
                </h1>
                <p className="text-xs text-amber-400" style={{ fontFamily: '"Raleway", sans-serif' }}>
                  {viewTitles[currentView]}
                </p>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-md ${
              queueOpen
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`} style={{ fontFamily: '"Raleway", sans-serif' }}>
              {queueOpen ? '🟢 OUVERTE' : '🔴 FERMÉE'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ===== TAB 1: CONTROLS =====
function ControlsTab({ 
  queueOpen, 
  currentPosition, 
  lastNumber,
  waitingCount,
  avgServiceTime,
  hasWaitingClients,
  onToggleQueue, 
  onStartService, 
  onResetQueue, 
  loading 
}: any) {
  const estimatedTotal = waitingCount * avgServiceTime;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: '"Orbitron", monospace' }}>
                {waitingCount}
              </div>
              <div className="text-xs text-white/60 flex items-center justify-center gap-1" style={{ fontFamily: '"Raleway", sans-serif' }}>
                <Users className="w-3 h-3" />
                En attente
              </div>
            </div>
            
            <div>
              <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: '"Orbitron", monospace' }}>
                {avgServiceTime}
              </div>
              <div className="text-xs text-white/60 flex items-center justify-center gap-1" style={{ fontFamily: '"Raleway", sans-serif' }}>
                <Clock className="w-3 h-3" />
                Moy (min)
              </div>
            </div>
            
            <div>
              <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: '"Orbitron", monospace' }}>
                ~{estimatedTotal}
              </div>
              <div className="text-xs text-white/60 flex items-center justify-center gap-1" style={{ fontFamily: '"Raleway", sans-serif' }}>
                <Clock className="w-3 h-3" />
                Total (min)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Controls */}
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
            Contrôles de la File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Queue Info */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Position Actuelle:
              </span>
              <span className="text-2xl font-bold text-amber-400" style={{ fontFamily: '"Orbitron", monospace' }}>
                #{currentPosition}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Dernier Ticket:
              </span>
              <span className="text-2xl font-bold text-amber-400" style={{ fontFamily: '"Orbitron", monospace' }}>
                #{lastNumber}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <Button
            onClick={onToggleQueue}
            className={`w-full h-14 text-base font-semibold ${
              queueOpen
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            style={{ fontFamily: '"Raleway", sans-serif' }}
          >
            {queueOpen ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Fermer la File
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Ouvrir la File
              </>
            )}
          </Button>
          
          <Button
            onClick={onStartService}
            disabled={loading || currentPosition > 0 || !hasWaitingClients}
            className="w-full h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            style={{ fontFamily: '"Raleway", sans-serif' }}
          >
            <Play className="w-5 h-5 mr-2" />
            Commencer le Service
          </Button>
          
          <Button
            onClick={onResetQueue}
            variant="outline"
            className="w-full h-12 text-base font-semibold border-2 border-red-400/50 text-red-400 hover:bg-red-500/10 bg-white/5"
            style={{ fontFamily: '"Raleway", sans-serif' }}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Réinitialiser la Journée
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== TAB 2: QUEUE MANAGEMENT =====
function QueueTab({ 
  currentClient, 
  waitingClients,
  allWaitingClients,
  onDone, 
  onSkip, 
  onCall, 
  loading 
}: any) {
  if (!currentClient && allWaitingClients.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <p className="text-white/80 text-lg" style={{ fontFamily: '"Raleway", sans-serif' }}>
            Aucun client dans la file
          </p>
          <p className="text-white/60 text-sm mt-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
            Appuyez sur "Commencer le Service" pour débuter
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Client */}
      {currentClient ? (
        <Card className="bg-white/5 backdrop-blur-md border-2 border-blue-500/50 shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-sm text-blue-400 font-semibold flex items-center justify-center gap-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
              EN SERVICE
              {(currentClient.skipCount || 0) > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                  Reporté {currentClient.skipCount}x
                </span>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-7xl font-bold text-white mb-2" style={{ fontFamily: '"Orbitron", monospace' }}>
                #{currentClient.number}
              </div>
              <div className="text-3xl font-semibold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
                {currentClient.firstName} {currentClient.lastName}
              </div>
              <div className="text-lg text-amber-400 mt-2 flex items-center justify-center gap-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
                <PhoneCall className="w-5 h-5" />
                {currentClient.phoneNumber}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={onDone}
                disabled={loading}
                className="h-16 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                style={{ fontFamily: '"Raleway", sans-serif' }}
              >
                <Check className="w-6 h-6 mr-2" />
                {loading ? '...' : 'Terminé'}
              </Button>
              
              <Button
                onClick={onSkip}
                disabled={loading}
                variant="outline"
                className={`h-16 text-lg font-bold border-2 disabled:opacity-50 bg-white/5 ${
                  (currentClient.skipCount || 0) >= 2
                    ? 'border-red-500 text-red-400 hover:bg-red-500/10' 
                    : 'border-amber-500 text-amber-400 hover:bg-amber-500/10'
                }`}
                style={{ fontFamily: '"Raleway", sans-serif' }}
              >
                <SkipForward className="w-6 h-6 mr-2" />
                {loading ? '...' : (currentClient.skipCount || 0) >= 2 ? 'Retirer' : 'Reporter'}
              </Button>
              
              <Button
                onClick={() => onCall(currentClient)}
                disabled={loading}
                className="h-16 text-lg font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                style={{ fontFamily: '"Raleway", sans-serif' }}
              >
                <PhoneCall className="w-6 h-6 mr-2" />
                Appeler
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-3" />
            <p className="text-white/80" style={{ fontFamily: '"Raleway", sans-serif' }}>
              Personne n'est servi actuellement
            </p>
          </CardContent>
        </Card>
      )}

      {/* Waiting List */}
      {waitingClients.length > 0 ? (
        <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
              <Users className="w-5 h-5" />
              Liste d'Attente ({waitingClients.length})
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {waitingClients.map((client: any) => {
                const skipCount = client.skipCount || 0;
                return (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-amber-400 w-16" style={{ fontFamily: '"Orbitron", monospace' }}>
                        #{client.number}
                      </div>
                      <div>
                        <div className="text-xl font-semibold text-white flex items-center gap-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
                          {client.firstName} {client.lastName}
                          {skipCount > 0 && (
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                              {skipCount}x reporté
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-white/60 flex items-center gap-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
                          <PhoneCall className="w-4 h-4" />
                          {client.phoneNumber}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => onCall(client)}
                      disabled={loading}
                      variant="outline"
                      className="h-12 px-6 border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10 font-semibold disabled:opacity-50 bg-white/5"
                      style={{ fontFamily: '"Raleway", sans-serif' }}
                    >
                      <PhoneCall className="w-4 h-4 mr-2" />
                      Appeler
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
          <CardContent className="py-8 text-center">
            <p className="text-white/60" style={{ fontFamily: '"Raleway", sans-serif' }}>
              Personne n'attend
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Alert className="bg-blue-500/10 backdrop-blur-md border border-blue-500/30">
        <Lightbulb className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200 text-sm" style={{ fontFamily: '"Raleway", sans-serif' }}>
          <strong>Logique de Report:</strong> 1er & 2e report = recule d'1 position (le n° de ticket reste). 3e report = retrait (absent).
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ===== TAB 3: ADD CLIENT =====
function AddClientTab({ onAddClient, loading, queueOpen }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,8}$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  const isValidPhone = /^\d{8}$/.test(phoneNumber);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !isValidPhone) return;
    
    const success = await onAddClient({ firstName, lastName, phoneNumber });
    
    if (success) {
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
            Ajouter un Client Manuellement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                disabled={!queueOpen || loading}
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
                disabled={!queueOpen || loading}
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
                Numéro de Téléphone
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="12345678"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className={`bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-amber-500/50 focus:ring-amber-500/50 ${
                  phoneNumber && !isValidPhone ? 'border-red-500' : ''
                }`}
                disabled={!queueOpen || loading}
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
              disabled={!firstName.trim() || !lastName.trim() || !isValidPhone || !queueOpen || loading}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50"
              style={{ fontFamily: '"Raleway", sans-serif' }}
            >
              {loading ? 'Ajout...' : 'Ajouter à la File ✨'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert className="bg-blue-500/10 backdrop-blur-md border border-blue-500/30">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200 text-sm" style={{ fontFamily: '"Raleway", sans-serif' }}>
          Utilisez cette fonction pour ajouter des clients qui n'ont pas de téléphone ou qui ont des difficultés avec l'application.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ===== TAB 4: STATS & FEEDBACK =====
function StatsTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
            Statistiques & Analytiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60" style={{ fontFamily: '"Raleway", sans-serif' }}>
              Fonctionnalité à venir
            </p>
            <p className="text-white/40 text-sm mt-2" style={{ fontFamily: '"Raleway", sans-serif' }}>
              Statistiques, analytiques et avis des clients seront disponibles ici
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== MAIN ADMIN COMPONENT =====
export default function BarberQueueAdmin() {
  const [currentView, setCurrentView] = useState<TabView>('controls');
  const [queueOpen, setQueueOpen] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [lastNumber, setLastNumber] = useState(0);
  const [avgServiceTime, setAvgServiceTime] = useState(15);
  const [currentClient, setCurrentClient] = useState(null);
  const [waitingClients, setWaitingClients] = useState([]);
  const [allWaitingClients, setAllWaitingClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // AlertDialog state
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    title: '',
    description: '',
    action: null as (() => void) | null,
    showCancel: false,
  });

  const waitingCount = allWaitingClients.length;

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
          console.log("✅ File initialisée");
        } catch (error) {
          console.error("❌ Échec d'initialisation:", error);
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
        if (!snap.exists()) return;
        const data = snap.data();
  
        setQueueOpen(data.queueOpen ?? true);
        setCurrentPosition(data.currentPosition ?? 0);
        setLastNumber(data.lastNumber ?? 0);
        setAvgServiceTime(data.avgServiceTime ?? 15);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Erreur d'écoute:", error);
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
  
  // ===== LISTEN TO ALL WAITING CLIENTS =====
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
  
  // ===== LISTEN TO WAITING LIST =====
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
    const action = queueOpen ? 'fermer' : 'ouvrir';
    
    setAlertDialog({
      open: true,
      title: queueOpen ? 'Fermer la file' : 'Ouvrir la file',
      description: `Êtes-vous sûr de vouloir ${action} la file d'attente ?`,
      showCancel: true,
      action: async () => {
        try {
          setAlertDialog(prev => ({ ...prev, open: false }));
          const queueRef = doc(db, "queues", "today");
          await updateDoc(queueRef, {
            queueOpen: !queueOpen,
            updatedAt: serverTimestamp()
          });
          console.log(`✅ File ${action}e`);
        } catch (error) {
          console.error(`❌ Échec de ${action}:`, error);
          setAlertDialog({
            open: true,
            title: 'Erreur',
            description: `Échec de ${action} la file. Veuillez réessayer.`,
            action: () => setAlertDialog(prev => ({ ...prev, open: false })),
            showCancel: false,
          });
        }
      }
    });
  };
  
  const handleStartService = async () => {
    if (actionLoading || currentPosition > 0 || allWaitingClients.length === 0) return;
    
    try {
      setActionLoading(true);
      
      // Get the first waiting client by position
      const firstClientQuery = query(
        collection(db, "queues", "today", "clients"),
        where("status", "==", "waiting"),
        orderBy("position", "asc"),
        limit(1)
      );
      
      const firstClientSnapshot = await getDocs(firstClientQuery);
      
      if (firstClientSnapshot.empty) {
        setAlertDialog({
          open: true,
          title: 'Erreur',
          description: 'Aucun client en attente.',
          action: () => setAlertDialog(prev => ({ ...prev, open: false })),
          showCancel: false,
        });
        setActionLoading(false);
        return;
      }
      
      const firstClient = firstClientSnapshot.docs[0];
      const firstClientData = firstClient.data();
      const firstPosition = firstClientData.position;
      
      const queueRef = doc(db, "queues", "today");
      
      await updateDoc(queueRef, {
        currentPosition: firstPosition,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Service démarré à la position #${firstPosition}`);
    } catch (error) {
      console.error('❌ Échec du démarrage:', error);
      setAlertDialog({
        open: true,
        title: 'Erreur',
        description: 'Échec du démarrage du service. Veuillez réessayer.',
        action: () => setAlertDialog(prev => ({ ...prev, open: false })),
        showCancel: false,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleResetQueue = async () => {
    setAlertDialog({
      open: true,
      title: 'Réinitialiser la file',
      description: '⚠️ Cela va réinitialiser toute la file. Êtes-vous sûr ?',
      showCancel: true,
      action: async () => {
        setAlertDialog({
          open: true,
          title: 'Confirmation finale',
          description: '⚠️⚠️ DERNIER AVERTISSEMENT : Cette action est irréversible !',
          showCancel: true,
          action: async () => {
            try {
              setActionLoading(true);
              setAlertDialog(prev => ({ ...prev, open: false }));
              
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
              
              console.log('✅ File réinitialisée');
              
              setAlertDialog({
                open: true,
                title: 'Succès',
                description: '✅ File réinitialisée avec succès !',
                action: () => setAlertDialog(prev => ({ ...prev, open: false })),
                showCancel: false,
              });
            } catch (error) {
              console.error('❌ Échec de réinitialisation:', error);
              setAlertDialog({
                open: true,
                title: 'Erreur',
                description: 'Échec de réinitialisation. Veuillez réessayer.',
                action: () => setAlertDialog(prev => ({ ...prev, open: false })),
                showCancel: false,
              });
            } finally {
              setActionLoading(false);
            }
          }
        });
      }
    });
  };
  
  const handleDone = async () => {
    if (!currentClient || actionLoading) return;
    
    try {
      setActionLoading(true);
      
      const queueRef = doc(db, "queues", "today");
      const clientRef = doc(db, "queues", "today", "clients", currentClient.id);
      
      // Get the next waiting client by position (not just increment)
      const nextClientQuery = query(
        collection(db, "queues", "today", "clients"),
        where("status", "==", "waiting"),
        where("position", ">", currentPosition),
        orderBy("position", "asc"),
        limit(1)
      );
      
      const nextClientSnapshot = await getDocs(nextClientQuery);
      
      await runTransaction(db, async (transaction) => {
        transaction.update(clientRef, {
          status: "done",
          completedAt: serverTimestamp()
        });
        
        // If there are more clients waiting, move to that client's position
        // Otherwise, reset currentPosition to 0 (idle state)
        if (!nextClientSnapshot.empty) {
          const nextClient = nextClientSnapshot.docs[0];
          const nextClientData = nextClient.data();
          const nextPosition = nextClientData.position;
          
          transaction.update(queueRef, {
            currentPosition: nextPosition,
            updatedAt: serverTimestamp()
          });
        } else {
          // No more clients waiting, reset to 0 (idle state)
          transaction.update(queueRef, {
            currentPosition: 0,
            updatedAt: serverTimestamp()
          });
        }
      });
      
      console.log(`✅ ${currentClient.firstName} ${currentClient.lastName} marqué comme terminé`);
    } catch (error) {
      console.error('❌ Échec:', error);
      setAlertDialog({
        open: true,
        title: 'Erreur',
        description: 'Échec de l\'action. Veuillez réessayer.',
        action: () => setAlertDialog(prev => ({ ...prev, open: false })),
        showCancel: false,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleSkip = async () => {
    if (!currentClient || actionLoading) return;
    
    const fullName = `${currentClient.firstName} ${currentClient.lastName}`;
    const skipCount = currentClient.skipCount || 0;
    
    if (skipCount >= 2) {
      setAlertDialog({
        open: true,
        title: 'Retirer le client',
        description: `⚠️ Retirer ${fullName} de la file ? (3e report - marqué comme absent)`,
        showCancel: true,
        action: async () => {
          try {
            setActionLoading(true);
            setAlertDialog(prev => ({ ...prev, open: false }));
            
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
            
            console.log(`❌ ${fullName} marqué comme absent (3e report)`);
          } catch (error) {
            console.error('❌ Échec:', error);
          } finally {
            setActionLoading(false);
          }
        }
      });
      return;
    }
    
    setAlertDialog({
      open: true,
      title: 'Reporter le client',
      description: `⚠️ Reporter ${fullName} ? Il reculera d'1 position. (Report ${skipCount + 1}/3)`,
      showCancel: true,
      action: async () => {
        try {
          setActionLoading(true);
          setAlertDialog(prev => ({ ...prev, open: false }));
          
          const queueRef = doc(db, "queues", "today");
          const clientRef = doc(db, "queues", "today", "clients", currentClient.id);
          
          const nextClientQuery = query(
            collection(db, "queues", "today", "clients"),
            where("status", "==", "waiting"),
            where("position", ">", currentPosition),
            orderBy("position", "asc"),
            limit(1)
          );
          
          const nextClientSnapshot = await getDocs(nextClientQuery);
          
          if (nextClientSnapshot.empty) {
            setAlertDialog({
              open: true,
              title: 'Impossible',
              description: '⚠️ Personne d\'autre dans la file pour échanger !',
              action: () => setAlertDialog(prev => ({ ...prev, open: false })),
              showCancel: false,
            });
            setActionLoading(false);
            return;
          }
          
          const nextClient = nextClientSnapshot.docs[0];
          const nextClientRef = doc(db, "queues", "today", "clients", nextClient.id);
          const nextClientData = nextClient.data();
          const nextClientPosition = nextClientData.position;
          
          await runTransaction(db, async (transaction) => {
            transaction.update(clientRef, {
              position: nextClientPosition,
              skipCount: skipCount + 1,
              lastSkippedAt: serverTimestamp()
            });
            
            transaction.update(nextClientRef, {
              position: currentPosition
            });
            
            transaction.update(queueRef, {
              updatedAt: serverTimestamp()
            });
          });
          
          console.log(`⚠️ ${fullName} #${currentClient.number} reporté`);
        } catch (error) {
          console.error('❌ Échec:', error);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };
  
  const handleCallClient = async (client: any) => {
    if (actionLoading) return;
    
    const fullName = `${client.firstName} ${client.lastName}`;
    const phoneNumber = client.phoneNumber;
    const telLink = `tel:${phoneNumber}`;
    window.location.href = telLink;
    
    console.log(`📢 Appel de ${fullName} au ${phoneNumber}`);
  };

  const handleAddClient = async ({ firstName, lastName, phoneNumber }: any) => {
    if (actionLoading) return false;
    
    try {
      setActionLoading(true);
      
      // Check for duplicate
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
        setActionLoading(false);
        return false;
      }
  
      const queueRef = doc(db, "queues", "today");
  
      await runTransaction(db, async (transaction) => {
        const queueSnap = await transaction.get(queueRef);
  
        if (!queueSnap.exists()) {
          throw new Error("File d'attente non initialisée");
        }
  
        const queueData = queueSnap.data();
  
        if (!queueData.queueOpen) {
          throw new Error("La file d'attente est fermée");
        }
  
        const nextNumber = (queueData.lastNumber ?? 0) + 1;
        const nextPosition = nextNumber;
        const clientId = crypto.randomUUID();
  
        const clientRef = doc(db, "queues", "today", "clients", clientId);
  
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
          addedBy: "admin"
        };
  
        transaction.set(clientRef, newClient);
        transaction.update(queueRef, {
          lastNumber: nextNumber,
          updatedAt: serverTimestamp(),
        });
      });

      setAlertDialog({
        open: true,
        title: 'Succès',
        description: `✅ ${firstName} ${lastName} ajouté à la file !`,
        action: () => setAlertDialog(prev => ({ ...prev, open: false })),
        showCancel: false,
      });
      
      return true;
  
    } catch (err) {
      console.error("❌ Échec d'ajout:", err);
      setAlertDialog({
        open: true,
        title: 'Erreur',
        description: err.message || "Échec de l'ajout à la file",
        action: () => setAlertDialog(prev => ({ ...prev, open: false })),
        showCancel: false,
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };
  
  // ===== DOCK ITEMS =====
  const dockItems = [
    {
      icon: <Settings size={18} />,
      label: 'Contrôles',
      onClick: () => setCurrentView('controls')
    },
    {
      icon: <List size={18} />,
      label: 'File d\'Attente',
      onClick: () => setCurrentView('queue')
    },
    {
      icon: <UserPlus size={18} />,
      label: 'Ajouter',
      onClick: () => setCurrentView('add')
    },
    {
      icon: <BarChart size={18} />,
      label: 'Statistiques',
      onClick: () => setCurrentView('stats')
    },
  ];

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="relative h-[100dvh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/background.jpg)" }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="text-center relative z-10">
          <Scissors className="w-12 h-12 text-amber-400 animate-pulse mx-auto mb-4" />
          <p className="text-white/80 text-lg" style={{ fontFamily: '"Raleway", sans-serif' }}>
            Chargement du panneau admin...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="relative min-h-[100dvh] overflow-hidden">
        {/* Background */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/background.jpg)" }}
        />
        
        {/* Dark Overlay */}
        <div className="fixed inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative z-10 min-h-[100dvh] pb-32">
          <AdminHeader queueOpen={queueOpen} currentView={currentView} />
          
          <div className="max-w-2xl mx-auto px-4 py-6">
            {currentView === 'controls' && (
              <ControlsTab
                queueOpen={queueOpen}
                currentPosition={currentPosition}
                lastNumber={lastNumber}
                waitingCount={waitingCount}
                avgServiceTime={avgServiceTime}
                hasWaitingClients={allWaitingClients.length > 0}
                onToggleQueue={handleToggleQueue}
                onStartService={handleStartService}
                onResetQueue={handleResetQueue}
                loading={actionLoading}
              />
            )}
            
            {currentView === 'queue' && (
              <QueueTab
                currentClient={currentClient}
                waitingClients={waitingClients}
                allWaitingClients={allWaitingClients}
                onDone={handleDone}
                onSkip={handleSkip}
                onCall={handleCallClient}
                loading={actionLoading}
              />
            )}
            
            {currentView === 'add' && (
              <AddClientTab
                onAddClient={handleAddClient}
                loading={actionLoading}
                queueOpen={queueOpen}
              />
            )}

            {currentView === 'stats' && (
              <StatsTab />
            )}
          </div>

          {/* Dock Navigation - Mobile Optimized */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <Dock 
              items={dockItems}
              panelHeight={68}
              baseItemSize={50}
              magnification={70}
            />
          </div>
        </div>
      </div>

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
              onClick={() => {
                if (alertDialog.action) {
                  alertDialog.action();
                }
              }}
              className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black hover:from-amber-500 hover:via-yellow-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/50 transition-all duration-200 rounded-xl h-11 px-6 font-bold"
              style={{ fontFamily: '"Raleway", sans-serif' }}
            >
              {alertDialog.showCancel ? 'Confirmer' : 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}