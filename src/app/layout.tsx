import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Viaggi Mensili",description:"Organizza i viaggi e tieni traccia dei tuoi guadagni mensili."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="it"><body>{children}</body></html>;}
