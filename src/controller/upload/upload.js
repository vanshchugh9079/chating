import ApiResponse from "../../utils/ApiResponse.js"
import { cloudinaryUpload } from "../../utils/cloudniaryUpload.js"
import fs from "fs"
let upload=async(req,res)=>{
    let file=req.file
    if(!file) return;
    let upload
    console.log(file);
    
    if(file){      
         upload=await cloudinaryUpload(file)
        if(upload){
            fs.unlink(file.path,()=>{
                console.log("file deleted")
            })
        }
    }
    let response=new ApiResponse(upload,200,"file uploaded successfully")
    res.status(200).json(response)
}
export default upload