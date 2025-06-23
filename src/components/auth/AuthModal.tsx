'use client';

import { useState } from 'react';
import { signIn, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, UserCheck, Chrome } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestContinue: () => void;
  title?: string;
  description?: string;
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  onGuestContinue,
  title = "Bienvenido a AgroVision",
  description = "Elige cómo quieres continuar"
}: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: window.location.href
      });
    } catch (error) {
      console.error('Error during Google login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestContinue = () => {
    onGuestContinue();
    onClose();
  };

  // Si ya está autenticado, cerrar el modal
  if (session?.user) {
    onClose();
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-green-700">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Opción de Google */}
          <Card className="border-green-200 hover:border-green-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
                Iniciar Sesión
              </CardTitle>
              <CardDescription>
                Mantén tu historial de chats y diagnósticos guardados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                size="lg"
              >
                <Chrome className="w-5 h-5 mr-2" />
                {isLoading ? 'Conectando...' : 'Continuar con Google'}
              </Button>
              <div className="mt-2 text-xs text-gray-500 text-center">
                ✓ Historial guardado permanentemente<br/>
                ✓ Acceso desde cualquier dispositivo<br/>
                ✓ Sincronización automática
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">o</span>
            </div>
          </div>

          {/* Opción de Invitado */}
          <Card className="border-orange-200 hover:border-orange-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-orange-600" />
                Continuar como Invitado
              </CardTitle>
              <CardDescription>
                Acceso rápido sin registro (datos temporales)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGuestContinue}
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                size="lg"
              >
                <User className="w-5 h-5 mr-2" />
                Entrar como Invitado
              </Button>
              <div className="mt-2 text-xs text-gray-500 text-center">
                ⚠️ Los datos se perderán al actualizar la página<br/>
                ⚠️ No se guarda historial permanente
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad
        </div>
      </DialogContent>
    </Dialog>
  );
}