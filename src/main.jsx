import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { client } from './appwrite'

// Run outside React effects so StrictMode does not send a second startup ping.
client.ping()
  .then(() => console.info('Appwrite connection confirmed: movielist'))
  .catch((error) => console.error('Appwrite connection failed:', error))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
