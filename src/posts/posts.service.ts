import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const createdPost = new this.postModel({
      ...createPostDto,
      user: userId,
    });
    return createdPost.save();
  }

  async findAll(): Promise<Post[]> {
    return this.postModel.find().populate('user', 'username').sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postModel.findById(id).populate('user', 'username').exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string): Promise<Post> {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.toString() !== userId.toString()) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const updatedPost = await this.postModel.findByIdAndUpdate(
      id,
      updatePostDto,
      { new: true }
    ).populate('user', 'username');

    return updatedPost;
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.toString() !== userId.toString()) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postModel.findByIdAndDelete(id);
  }
}

