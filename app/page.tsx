"use client"
import React from 'react';
import BarberQueueClient from '@/components/Barberqueueclient';
import ComingSoon from '@/components/Comingsoon';

export default function Page() {
  // Check if coming soon mode is enabled
  const isComingSoon = process.env.NEXT_PUBLIC_COMING_SOON === 'true';
  
  // Show Coming Soon page if enabled, otherwise show the actual app
  if (isComingSoon) {
    return <ComingSoon />;
  }
  
  return <BarberQueueClient />;
}