import { createContext, type ReactNode,useContext, useEffect, useState } from 'react'
type Theme='light'|'dark'
const ThemeContext=createContext({theme:'light' as Theme,toggle:()=>{}})
export function ThemeProvider({children}:{children:ReactNode}){const [theme,setTheme]=useState<Theme>(()=>(localStorage.getItem('theme') as Theme)||'light');useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark');localStorage.setItem('theme',theme)},[theme]);return <ThemeContext.Provider value={{theme,toggle:()=>setTheme(t=>t==='light'?'dark':'light')}}>
{children}
</ThemeContext.Provider>}
export const useTheme=()=>useContext(ThemeContext)
