import express from 'express';
import usersinforController from '#root/controller/user/userinfo';

const router = express.Router();

router.get('/', usersinforController.getfriendprofile);

export default router;
