import {useDispatch} from "react-redux"
import {register,login,getme,logout} from "../service/auth.api"
import {setUser,setLoading,setError,clearAuth} from "../auth.slice"
import {useNavigate} from "react-router-dom"
export function useAuth(){
    const dispatch=useDispatch()
  const navigate=useNavigate()
    async function handleRegister({userName,email,password,confirmPassword}) {
        try{
           dispatch(setLoading(true))
            const data = await register({userName,email,password,confirmPassword})
            dispatch(setError(null))
            return data
        } catch(error){
            dispatch (setError(error.response?.data?.message || "Registration Failed"))
            return false
        }
        finally{
            dispatch(setLoading(false))
        }
      
    }

async function handleLogin({ email, password }) {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));

    const data = await login({ email, password });

    dispatch(setUser(data.user));

    return true;
  } catch (error) {
    dispatch(
      setError(
        error.response?.data?.message || "Login Failed"
      )
    );

    return false;
  } finally {
    dispatch(setLoading(false));
  }
}

        async function handleGetme() {
        try{
           dispatch(setLoading(true))
            const data =await getme()
            dispatch(setUser(data.user))
        } catch(error){
            dispatch (setError(error.response?.data?.message || "Failed To fetch User Detail"))
        }
        finally{
            dispatch(setLoading(false))
        }
}

    async function handleLogout() {
      try {
        dispatch(setLoading(true))
        await logout()
      } catch (error) {
        dispatch(setError(error.response?.data?.message || "Logout Failed"))
      } finally {
        dispatch(clearAuth())
        dispatch(setLoading(false))
        navigate("/login")
      }
    }
return{
    handleRegister,
    handleLogin,
    handleGetme,
    handleLogout
}
}