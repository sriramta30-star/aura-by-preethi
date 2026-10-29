"use client";
import Link from "next/link";
import {demoProducts,formatINR} from "@/lib/products";
import {useStore} from "@/components/store-provider";
export default function WishlistPage(){
 const {wishlist,toggleWishlist,add}=useStore();const products=demoProducts.filter(p=>wishlist.includes(p.id));
 return <main className="page-shell"><span className="micro">SAVED FOR LATER</span><h1 className="page-title">Your wishlist</h1>{!products.length?<div className="empty-state"><h2>Your saved styles will live here.</h2><p>Tap the heart on any product to keep it close.</p><Link className="primary-button" href="/#shop">Explore collections</Link></div>:<div className="product-grid">{products.map(p=><article key={p.id} className="product-card"><Link href="/#shop"><img className="wishlist-image" src={p.image} alt={p.name}/></Link><div className="product-body"><h3>{p.name}</h3><strong>{formatINR(p.price)}</strong><div className="quick-actions"><button className="primary" onClick={()=>add(p.id)}>Add to bag</button><button className="secondary" onClick={()=>toggleWishlist(p.id)}>Remove</button></div></div></article>)}</div>}</main>;
}
