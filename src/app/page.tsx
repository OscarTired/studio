import { DiagnosisClientPage } from '@/components/diagnosis/DiagnosisClientPage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DiagnoseCropPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Bienvenido</CardTitle>
        </CardHeader>
        <CardContent>
          <DiagnosisClientPage />
        </CardContent>
      </Card>
    </div>
  );
}
