const jwt = require('jsonwebtoken');
function verifyToken(req, res, next) {
  if (req.headers.authorization !== undefined) {
    
    let token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEY, (err, data) => {
      if (!err) {
        next();
      } else {
        res.status(403).send({ message: "Invalid token" });
      }
    });
  }
  else {
    res.send({ message:"please send a token"})
  }
 
}
  
module.exports = verifyToken;