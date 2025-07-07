'use client'

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

type CartContextType = {
  cartCount: number;
  addToCart: () => void;
  showCartBubble: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

function FloatingCartButton() {
  const { showCartBubble } = useCart();

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


export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);
  const [showCartBubble, setShowCartBubble] = useState(false);

  const addToCart = useCallback(() => {
    setCartCount((count) => count + 1);
    if (!showCartBubble) {
        setShowCartBubble(true);
    }
  }, [showCartBubble]);

  const value = { cartCount, addToCart, showCartBubble };

  return (
    <CartContext.Provider value={value}>
      {children}
      <FloatingCartButton />
    </CartContext.Provider>
  );
};
