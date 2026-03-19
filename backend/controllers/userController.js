import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  if (user && (await user.matchPassword(password))) {
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      companyName: user.companyName,
      companyLogo: user.companyLogo,
      companyDescription: user.companyDescription,
      phoneNumber: user.phoneNumber,
      token: generateToken(user.id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, isAdmin, companyName, companyLogo, companyDescription, phoneNumber } = req.body;

  const userExists = await User.findOne({ where: { email } });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user object with conditionally added company fields
  const userData = {
    name,
    email,
    password,
    phoneNumber,
    isAdmin: !!isAdmin,
  };

  // Only add company fields if user is an admin
  if (isAdmin) {
    if (!companyName) {
      res.status(400);
      throw new Error('Company name is required for admin users');
    }

    userData.companyName = companyName;

    if (companyLogo) {
      userData.companyLogo = companyLogo;
    }

    if (companyDescription) {
      userData.companyDescription = companyDescription;
    }
  }

  const user = await User.create(userData);

  if (user) {
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      companyName: user.companyName,
      companyLogo: user.companyLogo,
      companyDescription: user.companyDescription,
      phoneNumber: user.phoneNumber,
      token: generateToken(user.id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (user) {
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      companyName: user.companyName,
      companyLogo: user.companyLogo,
      companyDescription: user.companyDescription,
      phoneNumber: user.phoneNumber,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

    if (req.body.password) {
      user.password = req.body.password;
    }

    if (user.isAdmin) {
      user.companyName = req.body.companyName || user.companyName;
      user.companyLogo = req.body.companyLogo || user.companyLogo;
      user.companyDescription = req.body.companyDescription || user.companyDescription;
    }

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      companyName: user.companyName,
      companyLogo: user.companyLogo,
      companyDescription: user.companyDescription,
      phoneNumber: user.phoneNumber,
      token: generateToken(user.id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export { authUser, registerUser, getUserProfile, updateUserProfile };