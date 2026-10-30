import type {Metadata} from "next";
import {notFound} from "next/navigation";
import ProductDetail from "./product-detail";
import {getProductBySlug} from "@/lib/product-data";

type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const product=await getProductBySlug(slug);
 if(!product)return {title:"Product not found"};
 const description=product.description.slice(0,155);
 return {
  title:product.name,
  description,
  alternates:{canonical:"/products/"+product.slug},
  openGraph:{type:"website",title:product.name,description,images:[{url:product.image,alt:product.name}]}
 };
}

export default async function ProductPage({params}:Props){
 const {slug}=await params;
 const product=await getProductBySlug(slug);
 if(!product)notFound();
 const structuredData={
  "@context":"https://schema.org","@type":"Product",
  name:product.name,description:product.description,image:[product.image],
  sku:product.id,brand:{"@type":"Brand",name:"Aura by Preethi"},
  category:product.category,
  offers:{"@type":"Offer",priceCurrency:"INR",price:product.price,
   availability:product.stock>0?"https://schema.org/InStock":"https://schema.org/OutOfStock",
   url:(process.env.NEXT_PUBLIC_SITE_URL||"").replace(/\/$/,"")+"/products/"+product.slug}
 };
 return <>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,"\\u003c")}}/>
  <ProductDetail product={product}/>
 </>;
}