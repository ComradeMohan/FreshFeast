'use client'

import React, { createContext, useState, useContext, ReactNode } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

type CartBubbleContextType = {
  showCartBubble: boolean;
  setShowCartBubble: (show: boolean) => void;
};

const CartBubbleContext = createContext<CartBubbleContextType | undefined>(undefined);

export const useCartBubble = () => {
  const context = useContext(CartBubbleContext);
  if (context === undefined) {
    throw new Error('useCartBubble must be used within a CartBubbleProvider');
  }
  return context;
};

function FloatingCartButton() {
  const { showCartBubble } = useCartBubble();

  if (!showCartBubble) {
    return null;
  }

  return (
    <Link 
      href="/cart" 
      className="fixed bottom-8 left-8 z-50 bg-accent text-accent-foreground p-4 rounded-full shadow-lg hover:bg-accent/90 transition-transform hover:scale-110 flex items-center justify-center animate-in fade-in zoom-in"
    >
      <ShoppingCart className="h-6 w-6" />
      <span className="sr-only">View Cart</span>
    </Link>
  );
}


export const CartBubbleProvider = ({ children }: { children: ReactNode }) => {
  const [showCartBubble, setShowCartBubble] = useState(false);

  return (
    <CartBubbleContext.Provider value={{ showCartBubble, setShowCartBubble }}>
      {children}
      <FloatingCartButton />
    </CartBubbleContext.Provider>
  );
};
