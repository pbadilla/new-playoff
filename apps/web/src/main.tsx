import React from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'

import { Dashboard } from './components/dashboard'
import { ThemeProvider } from './components/theme-provider'

import './styles.css'
const qc=new QueryClient()
createRoot(document.getElementById('root')!).render(<React.StrictMode>
<QueryClientProvider client={qc}>
<ThemeProvider>
<Dashboard/>
</ThemeProvider>
</QueryClientProvider>
</React.StrictMode>)
