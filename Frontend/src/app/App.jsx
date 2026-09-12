import React from 'react'
import AuthRoutes from '../Routes/app.routes'
import { useAuth } from '../features/auth/hook/useAuth'
import { useEffect } from 'react'
const App = () => {
  const auth=useAuth()
  useEffect(()=>{
    auth.handleGetme()
  },[])
  return (

  <>
      <AuthRoutes />
  </>
  )
}

export default App