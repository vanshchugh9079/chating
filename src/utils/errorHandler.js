const errorHandler = (fn) => {
    return async (req, res,next) => {
        try {
            await fn(req,res,next);
        } catch (error) {
            console.log(error.message);
            const statusCode = error.statusCode || 500;
            const responseBody ={ message: error.message };
            console.log(responseBody);
            res.status(statusCode).json(responseBody);
        }
    };
};
export default errorHandler;
