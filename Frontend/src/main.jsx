
import { createRoot } from 'react-dom/client'
import './app/index.css'
import App from './app/App.jsx'
import { store } from './app/app.store.js'
import {Provider} from "react-redux"
import { BrowserRouter } from 'react-router-dom'
createRoot(document.getElementById('root')).render(
  
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  
)
