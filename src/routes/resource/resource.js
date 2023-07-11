import express from 'express';
import resourceController from '#root/controller/resource/resource';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
import upload from '#root/middleware/uploadFiles/upload';
import getFileUpload from '#root/middleware/uploadFiles/getFileUpload';

const router = express.Router();

router.use(verifyJWT);

router
  .route('/')
  .get(checkPermission({ listType: 'shareList' }), resourceController.getMany)
  .post(getFileUpload, checkPermission({ listType: 'memberList' }), upload, resourceController.addNew);

router.route('/:id').delete(checkAuthor({ modelType: 'resources' }), resourceController.deleteOne);

export default router;