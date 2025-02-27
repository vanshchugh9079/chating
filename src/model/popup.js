import Swal from "sweetalert2";
async function popup(icon,title,text,showConfirmButton,timer){
    Swal.fire({
        icon,
        title,
        text,
        showConfirmButton,
        timer
      });
}
export default popup