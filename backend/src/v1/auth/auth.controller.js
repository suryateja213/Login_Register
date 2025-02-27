const { register, login } = require('./auth.service');
const { getUserData } = require('./auth.service');

const registerController = (req, res) => {
  register(req.body)
    .then((response) => res.status(201).json(response))
    .catch((err) => res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' }));
};

const loginController = (req, res) => {
  login(req.body)
    .then((response) => res.status(200).json(response))
    .catch((err) => res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' }));
};

const getUserController = (req, res) => {
  const userId = req.user.user_id;  // Retrieve user_id from the decoded token

  getUserData(userId)  // Call service to get user data
    .then((userData) => {
      res.status(200).json(userData);  // Return the user data as response
    })
    .catch((err) => {
      res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
    });
};

module.exports = { registerController, loginController,getUserController };
