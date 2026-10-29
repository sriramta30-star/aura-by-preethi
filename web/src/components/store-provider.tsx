"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
type CartItem={productId:string;quantity:number;size?:string;color?:string};
type StoreValue={cart:CartItem[];wishlist:string[];loaded:boolean;cartCount:number;add:(id:string,size?:string,color?:string)=>void;remove:(id:string,size?:string)=>void;quantity:(id:string,size:string|undefined,n:number)=>void;toggleWishlist:(id:string)=>void;clear:()=>void};
const Context=createContext<StoreValue|null>(null);
export function StoreProvider({children}:{children:React.ReactNode}){
 const [cart,setCart]=useState<CartItem[]>([]),[wishlist,setWishlist]=useState<string[]>([]),[loaded,setLoaded]=useState(false);
 useEffect(()=>{try{const a=localStorage.getItem("aura-cart-v1"),b=localStorage.getItem("aura-wishlist-v1");if(a)setCart(JSON.parse(a));if(b)setWishlist(JSON.parse(b));}catch{localStorage.removeItem("aura-cart-v1");localStorage.removeItem("aura-wishlist-v1");}finally{setLoaded(true);}},[]);
 useEffect(()=>{if(loaded){localStorage.setItem("aura-cart-v1",JSON.stringify(cart));localStorage.setItem("aura-wishlist-v1",JSON.stringify(wishlist));}},[cart,wishlist,loaded]);
 const add=useCallback((productId:string,size?:string,color?:string)=>setCart(items=>{const same=items.find(x=>x.productId===productId&&x.size===size&&x.color===color);return same?items.map(x=>x===same?{...x,quantity:Math.min(20,x.quantity+1)}:x):[...items,{productId,quantity:1,size,color}];}),[]);
 const remove=useCallback((id:string,size?:string)=>setCart(items=>items.filter(x=>!(x.productId===id&&x.size===size))),[]);
 const quantity=useCallback((id:string,size:string|undefined,n:number)=>setCart(items=>n<=0?items.filter(x=>!(x.productId===id&&x.size===size)):items.map(x=>x.productId===id&&x.size===size?{...x,quantity:Math.min(20,n)}:x)),[]);
 const toggleWishlist=useCallback((id:string)=>setWishlist(items=>items.includes(id)?items.filter(x=>x!==id):[...items,id]),[]);
 const clear=useCallback(()=>setCart([]),[]);
 const value=useMemo(()=>({cart,wishlist,loaded,cartCount:cart.reduce((n,x)=>n+x.quantity,0),add,remove,quantity,toggleWishlist,clear}),[cart,wishlist,loaded,add,remove,quantity,toggleWishlist,clear]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStore(){const value=useContext(Context);if(!value)throw new Error("StoreProvider is missing.");return value;}
