import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    trim: true,
    required: 'Firstname required',
    maxlength: 100,
    validate: value => {
      !validator.isAlpha(value, 'vi-VN', { ignore: " -'" }) &&
        _throw({
          code: 400,
          errors: [{ field: 'firstname', message: 'Invalid firstname' }],
          message: 'Invalid firstname',
        });
    },
  },

  lastname: {
    type: String,
    trim: true,
    required: 'Lastname required',
    maxlength: 100,
    validate: value => {
      !validator.isAlpha(value, 'vi-VN', { ignore: " -'" }) &&
        _throw({
          code: 400,
          errors: [{ field: 'lastname', message: 'Invalid lastname' }],
          message: 'Invalid lastname',
        });
    },
  },

  username: {
    type: String,
    trim: true,
    required: 'Username required',
    maxlength: 100,
    validate: value => {
      !validator.isAlphanumeric(value, 'vi-VN', { ignore: "-_'" }) &&
        _throw({
          code: 400,
          errors: [{ field: 'username', message: 'Invalid username' }],
          message: 'Invalid username',
        });
    },
  },

  email: {
    type: String,
    required: 'Email required',
    validate: value => {
      !validator.isEmail(value) &&
        _throw({
          code: 400,
          errors: [{ field: 'email', message: 'Invalid email' }],
          message: 'Invalid email',
        });
    },
  },

  avatar: {
    type: String,
  },

  dateOfBirth: {
    type: Date,
    max: new Date(),
    default: new Date(),
  },

  gender: {
    type: String,
    required: 'Gender required',
    enum: ['Male', 'Female', 'Non-binary'],
    default: 'Male',
  },
  national: {
    type: String,
  },

  description: {
    type: String,
    maxlength: 65000,
  },

  password: {
    type: String,
    minlength: 8,
    validate: value => {
      !validator.isStrongPassword(value, {
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 1,
        minSymbols: 1,
      }) &&
        _throw({
          code: 400,
          errors: [{ field: 'password', message: 'password is weak' }],
          message: 'password is weak',
        });
    },
  },

  accessToken: {
    type: String,
  },

  refreshToken: {
    type: String,
  },

  passwordToken: {
    type: String,
  },

  createdAt: {
    type: Date,
  },

  lastActiveAt: {
    type: Date,
  },

  lastUpdateAt: {
    type: Date,
    default: new Date(),
  },
});

const Users = mongoose.model('Users', userSchema);

export default Users;
