function ApiResponse(data=null,status,message=null){
    this.data = data;
    this.status = status;
    this.message = message;
}
export default ApiResponse