'use client'

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, onSnapshot, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { useToast } from './use-toast';

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  description: string;
  imageUrl: string;
  plan: 'weekly' | 'monthly';
  price: number;
  quantity: number;
};

type NewCartItem = Omit<CartItem, 'id'>;

type CartContextType = {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (item: NewCartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [user, authLoading] = useAuthState(auth);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const cartRef = collection(db, 'carts', user.uid, 'items');
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem));
      setCartItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cart items:", error);
      toast({
        variant: "destructive",
        title: "Could not load cart",
        description: "There was an issue fetching your cart items.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, toast]);


  const addToCart = useCallback(async (item: NewCartItem) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not logged in",
        description: "Please log in to add items to your cart.",
      });
      return;
    }

    const cartItemId = `${item.productId}-${item.plan}`;
    const cartItemRef = doc(db, 'carts', user.uid, 'items', cartItemId);

    try {
      const docSnap = await getDoc(cartItemRef);
      if (docSnap.exists()) {
        await updateDoc(cartItemRef, {
          quantity: increment(1)
        });
      } else {
        await setDoc(cartItemRef, item);
      }
      toast({
        title: "Added to cart!",
        description: `${item.name} has been added to your cart.`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        variant: "destructive",
        title: "Uh oh!",
        description: "Could not add item to cart.",
      });
    }
  }, [user, toast]);

  const removeFromCart = useCallback(async (itemId: string) => {
    if (!user) return;
    const cartItemRef = doc(db, 'carts', user.uid, 'items', itemId);
    try {
      await deleteDoc(cartItemRef);
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  }, [user]);

  const updateItemQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!user || quantity <= 0) return;
    const cartItemRef = doc(db, 'carts', user.uid, 'items', itemId);
    try {
      await updateDoc(cartItemRef, { quantity });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  }, [user]);

  const cartCount = React.useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const value = { cartItems, cartCount, loading, addToCart, removeFromCart, updateItemQuantity };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
