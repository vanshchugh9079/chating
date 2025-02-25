let jsonResponse = async (user) => {    
    // Generate and save token
    await user.generateToken();
    // Convert the user to a plain object and omit the password
    let sendUser = user.toObject();
    delete sendUser.password;
    return sendUser;
};

export default jsonResponse;
