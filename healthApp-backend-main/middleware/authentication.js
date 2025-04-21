const jwt = require('jsonwebtoken');

// Middleware to authenticate access tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Token received in header:', token); // Log the token

    if (!token) return res.status(401).send('Access denied, token missing!');

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send('Invalid token');
        req.user = user; // Attach the user to the request
        next();
    });
};

// Middleware to authenticate refresh tokens
const refreshToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const refreshToken = authHeader && authHeader.split(' ')[1];

    console.log('Refresh token received in header:', refreshToken); // Log the token

    if (!refreshToken) return res.status(401).send('Access denied, refreshToken missing!');

    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send('Forbidden! Invalid refreshToken');
        req.user = user; // Attach the user to the request
        next();
        const newAccessToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '15m' });
        
        res.json({ accessToken: newAccessToken });
    });
};

// Export the middlewares as an object
module.exports = {
    authenticateToken,
    refreshToken
};
