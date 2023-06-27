import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Likes from '#root/model/interaction/likes';
import mongoose from 'mongoose';
import { addTotalPageFields, getUserInfo, facet } from '#root/config/pipeline';

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

  update: asyncWrapper(async (req, res, next) => {
    const { id } = req.params,
      { type } = req.query,
      userId = req.userInfo._id;

    //Find and delete like
    const foundLike = await Likes.findOneAndDelete({ modelType: type, modelId: id, userId: userId });

    //If found and deleted successfully, send immedialy to front.
    if (foundLike) {
      return res.status(200).json({ data: foundLike, message: `user has unliked this ${type}` });
    }

    //If cannot find, meaning user has not liked yet, then create new one and notification
    else {
      //Create new Like document
      const newLike = await Likes.create({ modelType: type, modelId: id, userId: userId });

      //Transfer notiInfo to next middleware
      req.noti = {
        modelType: type,
        modelId: id,
        receiverId: result.userId,
        action: 'like',
      };

      //Transfer response to next middleware
      res.result = {
        code: 201,
        data: newLike,
        message: `user has liked this ${type}`,
      };
      next();
    }
  }),
};

export default likeController;
