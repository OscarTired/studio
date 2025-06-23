'use client';

import { useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Settings, History } from 'lucide-react';
import { AuthModal } from './AuthModal';
import Link from 'next/link';

interface UserBarProps {
  onAuthRequired?: () => void;
}

export function UserBar({ onAuthRequired }: UserBarProps) {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      // Opcional: limpiar localStorage de datos de invitado
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleGuestContinue = () => {
    // Simplemente cerrar el modal, el usuario continuará como invitado
    setShowAuthModal(false);
    onAuthRequired?.();
  };

  if (session?.user) {
    // Usuario autenticado
    return (
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Autenticado
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                <AvatarFallback className="bg-green-100 text-green-700">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user.name || 'Usuario'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/history" className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                <span>Historial</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Usuario no autenticado
  return (
    <>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="border-orange-300 text-orange-700">
          Modo Invitado
        </Badge>
        
        <Button 
          onClick={() => setShowAuthModal(true)}
          variant="outline"
          size="sm"
          className="border-green-300 text-green-700 hover:bg-green-50"
        >
          <User className="mr-2 h-4 w-4" />
          Iniciar Sesión
        </Button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onGuestContinue={handleGuestContinue}
        title="Iniciar Sesión en AgroVision"
        description="Guarda tu progreso y accede a todas las funciones"
      />
    </>
  );
}