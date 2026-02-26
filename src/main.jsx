import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm('Aplikasi versi baru tersedia. Muat ulang sekarang?')) {
            updateSW(true)
        }
    },
    onOfflineReady() {
        console.log('Aplikasi sudah siap digunakan secara offline.')
    },
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
