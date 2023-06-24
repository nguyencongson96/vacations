import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Likes from '#root/model/interaction/likes';
import mongoose from 'mongoose';
import { addTotalPageFields, getUserInfo, facet } from '#root/config/pipeline';
import checkPermission from '#root/utils/checkForbidden/checkPermission';
import Posts from '#root/model/vacation/posts';

const likeController = {
  getMany: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { type, page } = req.query;

    const result = await Likes.aggregate(
      //Filter based on modelType and modelId
      [{ $match: { modelType: type, modelId: new mongoose.Types.ObjectId(id) } }].concat(
        //Add 3 fields, total, page, pages
        addTotalPageFields({ page }),

        //Look up to users model to get info
        getUserInfo({ field: ['username', 'avatar'] }),

        //Restructure query
        facet({ meta: ['total', 'page', 'pages'], data: ['authorInfo'] })
      )
    );
    return result.length === 0 ? res.sendStatus(204) : res.status(200).json(result[0]);
  }),

  update: asyncWrapper(async (req, res) => {
    const { id } = req.params,
      { type } = req.query,
      userId = req.userInfo._id;

    //Check permission of this type
    if (type === 'post') {
      //Throw an error if cannot find post
      const foundPost = await Posts.findById(id);
      !foundPost &&
        _throw({
          code: 404,
          errors: [{ field: 'postId', message: 'postId not found' }],
          message: 'post not found',
        });
      //Check whether user has permission to see this vacation
      await checkPermission({ crUserId: userId, modelType: 'vacation', modelId: foundPost.vacationId });
    }

    //Check whether user has permission to see this modelType
    else await checkPermission({ crUserId: userId, modelType: type, modelId: id });

    //Find and delete like
    const foundLike = await Likes.findOneAndDelete({ modelType: type, modelId: id, userId: userId });

    //If found and deleted successfully, send immedialy to front. If cannot find, meaning user did not like, then create new document and save to collection
    return foundLike
      ? res.status(200).json({ data: foundLike, message: `user has unliked this ${type}` })
      : res
          .status(201)
          .json({
            data: await Likes.create({ modelType: type, modelId: id, userId: userId }),
            message: `user has liked this ${type}`,
          });
  }),
};

export default likeController;
