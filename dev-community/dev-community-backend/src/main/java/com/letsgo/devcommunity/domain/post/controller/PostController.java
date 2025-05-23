package com.letsgo.devcommunity.domain.post.controller;

import com.letsgo.devcommunity.domain.post.dto.*;
import  com.letsgo.devcommunity.domain.post.entity.Comment;
import com.letsgo.devcommunity.domain.post.entity.Post;
import com.letsgo.devcommunity.domain.post.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/post")
public class PostController {
    private final PostService postService;

    @Autowired
    public PostController(PostService postService){
        this.postService = postService;
    }

    @PostMapping
    public CreateResponseDto createPost(@RequestBody UpdateDto updateDto) {
        return postService.createPost(updateDto);
    }

    @GetMapping("/{postId}")
    public PostDto getOnePost(@PathVariable("postId") Long id) {
        return postService.getOnePost(id);
    }

    @GetMapping
    public PostListDto getAll(@RequestParam(defaultValue = "0") Integer page,
                              @RequestParam(defaultValue = "10") Integer size,
                              @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return postService.findAll(page, size, sort);
    }

    @PutMapping("/{postId}")
    public UpdateResponseDto updatePost(@PathVariable("postId") Long id, @RequestBody UpdateDto updateDto) {
        return postService.updatePost(id, updateDto);
    }

    @DeleteMapping("/{postId}")
    public void deletePost(@PathVariable("postId") Long id) {
        postService.deletePost(id);
    }

    @PostMapping("/{postId}/comment")
    public CreateResponseDto createComment(@PathVariable("postId") Long id, @RequestBody CreateCommentDto comment){
        return postService.createComment(id, comment);
    }



    @PostMapping("/{postId}/like")
    public void createPostLike(@PathVariable("postId") Long id) {
        postService.createPostLike(id);
    }

    @DeleteMapping("/{postId}/like")
    public void deletePostLike(@PathVariable("postId") Long id){
        postService.deletePostLike(id);
    }

    //추후 수정 필요
    @GetMapping("/my/{userId}")
    public List<Post> getUserPosts(@PathVariable("userId") Long userId) {
        return postService.getUserPosts(userId);
    }
    @GetMapping("/like/{userId}")
    public List<Post> getUserPostLike(@PathVariable("userId") Long userId) {
        return postService.getUserPostLike(userId);
    }

}
