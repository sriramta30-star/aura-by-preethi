import type {Metadata,Viewport} from "next";
import Link from "next/link";
import {StoreProvider} from "@/components/store-provider";
import "./globals.css";
const site=process.env.NEXT_PUBLIC_SITE_URL;
export const metadata:Metadata={
 metadataBase:site?new URL(site):undefined,
 alternates:{canonical:"/"},
 icons:{icon:"/aura-logo.svg"},
 title:{default:"Aura by Preethi | Sarees, Designer Blouses & Custom Stitching",template:"%s | Aura by Preethi"},
 description:"Shop elegant sarees, designer blouses and custom blouse stitching at Aura by Preethi. Discover timeless Indian ethnic wear and festive styles.",
 keywords:["sarees online India","designer sarees","silk sarees online","organza sarees","ready-made blouses","designer blouses online","blouse stitching","custom blouse design","Indian ethnic wear","festive sarees","Aura by Preethi"],
 openGraph:{type:"website",siteName:"Aura by Preethi",title:"Aura by Preethi | Curated specially for you",description:"Discover elegant sarees, ready-made designer blouses and made-to-stitch styles.",images:[{url:"/aura-user-logo.webp",alt:"Aura by Preethi logo"}]},
 robots:{index:true,follow:true}
};
export const viewport:Viewport={themeColor:"#741b32",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en-IN"><body>
 <div className="announcement"><span>Complimentary shipping on orders above ₹1,999</span><span className="announcement-links">Shipping across India · Help & support</span></div>
 <header className="site-header"><div className="header-main">
 <Link className="header-search" href="/#shop" aria-label="Browse and search collections">⌕ <span>Search sarees, blouses, collections...</span></Link>
 <Link href="/" className="brand"><img src="/aura-user-logo.webp" alt="Aura by Preethi, curated specially for you"/></Link>
 <nav className="header-actions"><Link href="/login"><span>♙</span><small>Account</small></Link><Link href="/wishlist"><span>♡</span><small>Wishlist</small></Link><Link href="/cart"><span>♧</span><small>Bag</small></Link></nav>
 </div><nav className="main-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/#shop">Sarees</Link><Link href="/#shop?category=blouses">Ready-made blouses</Link><Link href="/made-to-stitch">Made-to-stitch</Link><Link href="/#shop">New arrivals</Link><Link href="/#shop">Collections</Link><Link href="/#story">Our story</Link><Link href="#footer">Contact</Link></nav></header>
 <StoreProvider>{children}</StoreProvider>
 </body></html>;
}
