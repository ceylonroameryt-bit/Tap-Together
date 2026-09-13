import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Tap Together · 12 Cute 3D Games',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},description:'Twelve animated 3D games, including a solo or shared frog garden, with touch controls for phones and shared rooms. Create a room, share the code, and play from anywhere.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
