'use client';

import { DiagnosisClientPage } from '@/components/diagnosis/DiagnosisClientPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || undefined;
  
  return <DiagnosisClientPage sessionId={sessionId} />;
}

export default function DiagnoseCropPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Agrivision</CardTitle>
          <CardDescription className="text-center">
            Una visión al Futuro de la Agricultura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando...</div>}>
            <SearchParamsWrapper />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
