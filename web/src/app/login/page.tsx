import {Suspense} from "react";
import LoginForm from "./login-form";
export const metadata={title:"Customer account",robots:{index:false,follow:false}};
export default function LoginPage(){
 return <Suspense fallback={<main className="page-shell"><p>Preparing your account...</p></main>}><LoginForm/></Suspense>;
}