import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Comments from '#root/model/interaction/comments';
import mongoose from 'mongoose';
import { addTotalPageFields, getUserInfo, facet } from '#root/config/pipeline';
import checkAuthor from '#root/utils/checkForbidden/checkAuthor';
import checkPermission from '#root/utils/checkForbidden/checkPermission';
import Posts from '#root/model/vacation/posts';

const commentController = {
  getMany: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { type, page } = req.query;

    const result = await Comments.aggregate(
      [].concat(
        //Filter based on modelType and modelId
        { $match: { modelType: type, modelId: new mongoose.Types.ObjectId(id) } },

        //Add 3 fields, total, page, pages
        addTotalPageFields({ page }),

        //Look up to users model to get info
        getUserInfo({ field: ['username', 'avatar'] }),

        //Restructure query
        facet({ meta: ['total', 'page', 'pages'], data: ['authorInfo', 'content'] })
      )
    );
    return result.length === 0 ? res.sendStatus(204) : res.status(200).json(result[0]);
  }),

  addNew: asyncWrapper(async (req, res, next) => {
    const { id } = req.params,
      { type } = req.query,
      { content } = req.body,
      userId = req.userInfo._id;

    let result;
    switch (type) {
      case 'post':
        const foundPost = await Posts.findById(id);
        //Throw an error if cannot find post
        !foundPost &&
          _throw({
            code: 404,
            errors: [{ field: 'post', message: `post not found` }],
            message: `not found`,
          });
        //Throw an error if user is unable to see this post
        result = await checkPermission({ crUserId: userId, modelType: 'vacation', modelId: foundPost.vacationId });
        break;

      default:
        //Throw an error if user is unable to see this model Type
        result = await checkPermission({ crUserId: userId, modelType: type, modelId: id });
        break;
    }

    //Create new comment
    const newComment = await Comments.create({ modelType: type, modelId: id, userId, content, createdAt: new Date() });

    //Create new Notification or update document
    req.noti = {
      modelType: type,
      modelId: id,
      receiverId: result.userId,
      action: 'comment',
    };

    //Transfer response to next middleware
    res.result = {
      code: 201,
      data: newComment,
      message: `add comment successfully`,
    };
    next();
  }),

  update: asyncWrapper(async (req, res) => {
    const { id } = req.params,
      { content } = req.body,
      userId = req.userInfo._id;

    //Check user is right author or not
    const foundComment = await checkAuthor({ modelType: 'comment', modelId: id, userId: userId });

    //Save new content to DB
    foundComment.content = content;
    foundComment.lastUpdateAt = new Date();
    await foundComment.save();

    //Send to front
    return res.status(201).json({ data: foundComment, message: 'update comment successfully' });
  }),

  delete: asyncWrapper(async (req, res) => {
    const { id } = req.params,
      userId = req.userInfo._id;

    //Check user is right author or not
    await checkAuthor({ modelType: 'comment', modelId: id, userId: userId });

    //Delete comment from DB
    const deleteComment = await Comments.findByIdAndDelete(id);

    //Send to front
    return res.status(200).json({ data: deleteComment, message: 'delete comment successfully' });
  }),
};

export default commentController;