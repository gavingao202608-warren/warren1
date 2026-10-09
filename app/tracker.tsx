'use client';import {useEffect} from 'react';
export default function Tracker(){useEffect(()=>{if(location.pathname.startsWith('/admin'))return;fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:location.href,referrer:document.referrer}),keepalive:true}).catch(()=>{});},[]);return null;}
