import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo'
import '@fontsource-variable/jetbrains-mono'
import { App } from './App.tsx'
import './styles.css'

createRoot(document.getElementById('root')!).render(<App />)
