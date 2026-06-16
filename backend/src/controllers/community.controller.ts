import { Response, NextFunction } from 'express';
import { Database, Post, Comment } from '../models/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';

export const getFeed = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  try {
    const posts = Database.getPosts();
    // Sort posts by creation date descending
    const sortedPosts = [...posts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.status(200).json({
      success: true,
      data: sortedPosts
    });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  const { content, badgeShared } = req.body;

  if (!content || content.trim().length === 0) {
    return next(new AppError('Post content cannot be empty', 400));
  }

  try {
    const newPost: Post = {
      id: Math.random().toString(36).substring(2, 11),
      userId: req.user.id,
      userName: req.user.name,
      content: content.trim(),
      likes: [],
      comments: [],
      badgeShared: badgeShared || undefined,
      createdAt: new Date().toISOString()
    };

    const posts = Database.getPosts();
    posts.push(newPost);
    Database.setPosts(posts);

    // Update Community challenge (community_post)
    const gamifications = Database.getGamification();
    const gIndex = gamifications.findIndex((g) => g.userId === req.user!.id);
    let extraFeedback = '';

    if (gIndex !== -1) {
      const gState = gamifications[gIndex];
      const commChallenge = gState.challenges.find((c) => c.id === 'community_post');
      if (commChallenge && !commChallenge.completed) {
        commChallenge.currentValue = 1;
        commChallenge.completed = true;
        gState.ecoPoints += commChallenge.pointsReward;
        
        // Add Badge: Eco Advocate
        gState.badges.push({
          id: 'badge_eco_advocate',
          name: 'Eco Advocate',
          description: 'Shared a post in the community feed',
          icon: '🗣️',
          unlockedAt: new Date().toISOString()
        });
        extraFeedback += ` Unlocked Achievement: Eco Advocate! (+${commChallenge.pointsReward} points).`;
      }
      gamifications[gIndex] = gState;
      Database.setGamification(gamifications);
    }

    res.status(201).json({
      success: true,
      message: `Post published successfully.${extraFeedback}`,
      data: newPost
    });
  } catch (error) {
    next(error);
  }
};

export const likePost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  const { id } = req.params;

  try {
    const posts = Database.getPosts();
    const postIndex = posts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return next(new AppError('Post not found', 404));
    }

    const post = posts[postIndex];
    const userIndex = post.likes.indexOf(req.user.id);
    let liked = false;

    if (userIndex === -1) {
      // Like
      post.likes.push(req.user.id);
      liked = true;
    } else {
      // Unlike
      post.likes.splice(userIndex, 1);
    }

    posts[postIndex] = post;
    Database.setPosts(posts);

    res.status(200).json({
      success: true,
      message: liked ? 'Post liked' : 'Post unliked',
      data: {
        likes: post.likes,
        liked
      }
    });
  } catch (error) {
    next(error);
  }
};

export const commentPost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  const { id } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return next(new AppError('Comment content cannot be empty', 400));
  }

  try {
    const posts = Database.getPosts();
    const postIndex = posts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return next(new AppError('Post not found', 404));
    }

    const post = posts[postIndex];
    const newComment: Comment = {
      id: Math.random().toString(36).substring(2, 11),
      userId: req.user.id,
      userName: req.user.name,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    post.comments.push(newComment);
    posts[postIndex] = post;
    Database.setPosts(posts);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    next(error);
  }
};
