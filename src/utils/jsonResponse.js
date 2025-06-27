let jsonResponse = async (user) => {    
    // Generate and save token
    await user.generateToken();
    console.log(user);
    console.log("on the json response");
    
    
    // Convert the user to a plain object and omit the password
    let sendUser = user.toObject();
    return sendUser;
};

export default jsonResponse;
