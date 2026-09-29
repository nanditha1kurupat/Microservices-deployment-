const User = require('../models/User');

// Create User
exports.createuser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password });
        return res.status(201).json(user);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Get User By ID
exports.getuser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(user);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Get All Users
exports.getallusers = async (req, res) => {
    try {
        const users = await User.find();
        return res.status(200).json(users);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};