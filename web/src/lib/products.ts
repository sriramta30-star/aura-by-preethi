export type Product = {
  id: string; slug: string; name: string; category: "Sarees" | "Ready-made Blouses" | "Made-to-stitch";
  price: number; compareAt?: number; description: string; fabric: string; colors: string[];
  sizes?: string[]; stock: number; image: string; badge?: string;
};
export const demoProducts: Product[] = [
 {id:"saree-tissue-001",slug:"tissue-silk-saree",name:"Tissue Silk Saree",category:"Sarees",price:2499,compareAt:2999,description:"A rich tissue silk drape with a refined festive finish for celebrations and special evenings.",fabric:"Tissue silk blend",colors:["Maroon","Rose","Gold"],stock:12,image:"/fashion/saree-maroon.jpg",badge:"Bestseller"},
 {id:"saree-organza-002",slug:"organza-saree",name:"Organza Saree",category:"Sarees",price:2899,description:"Airy organza with a graceful silhouette for receptions, gifting and festive gatherings.",fabric:"Organza",colors:["Ivory","Blush","Wine"],stock:8,image:"/fashion/saree-ivory.jpg",badge:"New arrival"},
 {id:"saree-georgette-003",slug:"georgette-saree",name:"Georgette Saree",category:"Sarees",price:1999,description:"An easy-to-style drape with soft movement for everyday elegance and occasions.",fabric:"Georgette",colors:["Lavender","Rose","Wine"],stock:16,image:"/fashion/saree-ivory.jpg"},
 {id:"saree-chanderi-004",slug:"chanderi-saree",name:"Chanderi Saree",category:"Sarees",price:2699,description:"A light, luminous drape that pairs beautifully with a statement blouse.",fabric:"Chanderi blend",colors:["Peach","Rose","Sand"],stock:7,image:"/fashion/saree-maroon.jpg"},
 {id:"blouse-maroon-005",slug:"maroon-embroidered-blouse",name:"Maroon Embroidered Blouse",category:"Ready-made Blouses",price:1299,description:"A richly toned blouse with delicate embroidery to complement your favourite saree.",fabric:"Silk blend",colors:["Maroon","Wine"],sizes:["XS","S","M","L","XL"],stock:10,image:"/fashion/blouse-maroon.jpg",badge:"Popular"},
 {id:"blouse-beige-006",slug:"beige-silk-blouse",name:"Beige Silk Blouse",category:"Ready-made Blouses",price:1199,description:"A versatile silk-blend blouse in a soft neutral shade, designed to coordinate with multiple drapes.",fabric:"Silk blend",colors:["Beige","Champagne"],sizes:["XS","S","M","L","XL"],stock:9,image:"/fashion/saree-ivory.jpg"},
 {id:"blouse-green-007",slug:"green-v-neck-blouse",name:"Green V-Neck Blouse",category:"Ready-made Blouses",price:1399,description:"A jewel-green blouse with a flattering neckline and festive detailing.",fabric:"Cotton silk blend",colors:["Emerald","Bottle green"],sizes:["XS","S","M","L","XL"],stock:6,image:"/fashion/blouse-maroon.jpg"},
 {id:"stitch-custom-008",slug:"custom-blouse-stitching",name:"Custom Blouse Stitching",category:"Made-to-stitch",price:1599,description:"Starting price for made-to-stitch blouse services. Final pricing depends on design, fabric and measurements.",fabric:"Customer-selected fabric",colors:["Custom"],stock:99,image:"/fashion/blouse-maroon.jpg",badge:"Made for you"}
];
export const formatINR = (amount:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(amount);
