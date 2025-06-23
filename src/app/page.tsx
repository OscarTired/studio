'use client';

import { DiagnosisClientPage } from '@/components/diagnosis/DiagnosisClientPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';

export default function DiagnoseCropPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || undefined;
  
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
          <DiagnosisClientPage sessionId={sessionId} />
        </CardContent>
      </Card>
    </div>
  );
}
