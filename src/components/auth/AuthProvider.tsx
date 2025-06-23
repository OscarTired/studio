'use client';

import { ReactNode } from 'react';

// Better Auth no requiere un proveedor específico como otros sistemas de auth
// El cliente se maneja directamente a través de los hooks
// Este componente es principalmente para futuras extensiones

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}