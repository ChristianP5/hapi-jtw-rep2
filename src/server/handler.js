const jwt = require('@hapi/jwt');

const users = [
    {
        username: "Bob",
        password: "111",
    },
    {
        username: "David",
        password: "222",
    },
];

let refreshTokens = [];

const getProtectedHandler = (request, h) => {
    const response = h.response({
        status: 'success',
        message: `Welcome ${request.auth.credentials.username}. You are Authorized!`,
    })

    response.code(200);
    return response;
}

const postLoginHandler = (request, h) => {

    if(request.auth.isAuthenticated){
        return 'Already Authenticated!'
    }

    const { username, password } = request.payload;

    try{
        validateUser(username, password);
    }catch(error){
        console.error('Invalid Login Credentials');
        const response = h.response({
            status: 'fail',
            message: `${error.message}`
        })

        response.code(404);
        return response;
    }

    // USER is Valid
    // Generate Access Token for the User

    const payload = {
        username: username,
    }

    const token = generateAccessToken(payload);

    // Generate Refresh Access Token
    const refreshToken = generateRefreshToken(payload);
    refreshTokens.push(refreshToken);
    
    const response = h.response({
        status: 'success',
        message: 'Login Successful!',
        token: token,
        refreshToken: refreshToken,
    })

    response.code(201);


    return response;
}

const postTokenHandler = (request, h) => {

    const { refreshToken } = request.payload;
    
    // Valid Refresh Token?
    if(!refreshToken || !refreshTokens.includes(refreshToken)){
        const response = h.response({
            status: 'fail',
            message: 'Invalid Refresh Token!',
        })

        response.code(400);
        return response;
    }

    // Valid Refresh Token
    const decodedToken = jwt.token.decode(refreshToken);
    const { username } = decodedToken.decoded.payload;

    const payload = {
        username: username,
    }

    const newToken = generateAccessToken(payload);

    const response = h.response({
        status: 'success',
        message: 'Acess Token Succesfully Refreshed!',
        token: newToken,
    })

    response.code(200);
    return response;
}

const postLogoutHandler = (request, h) => {
    const { refreshToken } = request.payload;
    // Valid Refresh Token?
    if(!refreshToken || !refreshTokens.includes(refreshToken)){
        const response = h.response({
            status: 'fail',
            message: 'Invalid Refresh Token!',
        })

        response.code(400);
        return response;
    }

    // Valid Refresh Token
    refreshTokens = refreshTokens.filter(refreshToken => refreshToken!==refreshToken);

    const response = h.response({
        status: 'success',
        message: 'Refresh Token Removed Successfully!',
    })

    response.code(200);
    return response;
    
}

const validateUser = (username, password) => {
    // Is Username Empty?
    if(!username){
        throw new Error('Please Enter Username!');
    }

    // Is User Valid?
    const currentUser = users.filter(user => user.username === username)[0];
    if(!currentUser || currentUser.password !== password){
        throw new Error('Username/Password is Wrong!');
    }

    // User is Valid
    return true;
}

const generateAccessToken = (payload) => {
    const token = jwt.token.generate(payload, process.env.ACCESS_TOKEN_SECRET, {
        ttlSec: 10,
    })

    return token;
}

const generateRefreshToken = (payload) => {
    const token = jwt.token.generate(payload, process.env.REFRESH_TOKEN_SECRET)
    return token;
}

module.exports = {
    getProtectedHandler, postLoginHandler,
    postTokenHandler, postLogoutHandler
}