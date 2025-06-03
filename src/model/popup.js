import Swal from "sweetalert2";
import { setUserData } from "../redux/slice/user.slice";
async function popup(icon, title, text, showConfirmButton, timer, showCancelButton = false ,dispatch=null,navigate=null) {
  Swal.fire({
    icon,
    title,
    text,
    showConfirmButton,
    timer,
    showCancelButton,
    cancelButtonText: "Cancel"
  }).then((res) => {
    if (dispatch && navigate) {
      if (res.isConfirmed) {
        dispatch(setUserData({
          user: {},
          loggedIn: false
        }))
        window.localStorage.clear();
        navigate("/")
      } else if (res.isDismissed) {
        console.log("Dismissed!");
      }
    }
  });
}
export default popup